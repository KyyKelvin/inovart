import { createClient } from "@supabase/supabase-js";
import { ImageMagick, initializeImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import { contactSchema, submissionSchema, submissionFilesSchema, editorialSchema, identifyImage, assertImageDimensions } from "../_shared/validation.ts";
import { z } from "zod";

const url = Deno.env.get("SUPABASE_URL")!;
const keyMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const serviceKey = keyMap.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(url, serviceKey, { auth:{persistSession:false,autoRefreshToken:false} });
let magickReady: Promise<void> | undefined;
function ensureMagick() {
  magickReady ??= Deno.readFile(new URL("magick.wasm",import.meta.resolve("@imagemagick/magick-wasm"))).then(initializeImageMagick);
  return magickReady;
}
class ApiError extends Error {
  constructor(message:string,readonly status=400,readonly retryAfter?:number){super(message);this.name="ApiError";}
}
const reply = (body:unknown,status=200,headers:Record<string,string>={}) => Response.json(body,{status,headers:{"Cache-Control":"no-store",...headers}});
async function digest(value:string) {
  const data=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(data)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function checkProxy(request:Request) {
  const token=request.headers.get("x-inovart-token");
  if(!token || token.length<32)return false;
  const {data,error}=await db.rpc("read_integration_setting",{p_key:"proxy_token_sha256"});
  if(error||!data)return false;
  const actual=await digest(token);
  if(actual.length!==data.length)return false;
  let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^data.charCodeAt(i);
  return diff===0;
}
async function rateLimit(request:Request,email:string,action:"submission"|"contact") {
  const fingerprint=request.headers.get("x-inovart-client-hash")||"";
  if(!/^[a-f0-9]{64}$/.test(fingerprint))throw new ApiError("Acesso não autorizado.",401);
  const emailKey=await digest(`${serviceKey}:${action}:email:${email.trim().toLowerCase()}`);
  const checks:[[string,number],[string,number]]=[
    [`${action}:client:${fingerprint}`,action==="submission"?4:12],
    [`${action}:email:${emailKey}`,action==="submission"?3:8],
  ];
  for(const[p_key,p_limit]of checks){
    const {data,error}=await db.rpc("consume_request_limit",{p_key,p_limit});
    if(error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
    if(!data)throw new ApiError("Limite de envios atingido. Tente novamente em uma hora.",429,3600);
  }
}
async function imageBytes(file:Blob,declaredType=file.type) {
  const bytes=new Uint8Array(await file.arrayBuffer());
  let detected:string;
  try{detected=identifyImage(bytes);}catch(error){throw new ApiError(error instanceof Error?error.message:"Imagem inválida.",413);}
  if(declaredType && detected!==declaredType)throw new ApiError("O conteúdo da imagem não corresponde ao formato informado.",400);
  try{assertImageDimensions(bytes);}catch(error){
    const message=error instanceof Error?error.message:"Imagem inválida.";
    throw new ApiError(message,message.includes("excede")?413:400);
  }
  await ensureMagick();
  try{
    return ImageMagick.read(bytes,image=>{
      if(image.width>Math.floor(12000000/image.height))throw new ApiError("A imagem excede 12 megapixels.",413);
      image.autoOrient();
      const ratio=Math.min(1,1800/Math.max(image.width,image.height));
      if(ratio<1)image.resize(Math.max(1,Math.round(image.width*ratio)),Math.max(1,Math.round(image.height*ratio)));
      image.strip();image.quality=82;
      return image.write(MagickFormat.WebP,result=>Uint8Array.from(result));
    });
  }catch(error){
    if(error instanceof ApiError)throw error;
    throw new ApiError("Não foi possível decodificar a imagem.",400);
  }
}
async function submitLegacy(request:Request) {
  if(Number(request.headers.get("content-length")||0)>36*1024*1024)return reply({error:"Envio muito grande."},413);
  const form=await request.formData();
  if(form.get("website"))return reply({error:"Envio recusado."},400);
  const parsed=submissionSchema.parse(JSON.parse(String(form.get("data")||"{}")));
  const id=z.string().uuid().parse(form.get("request_id"));
  const known=new Set(["data","website","request_id","portrait",...parsed.works.flatMap((_,i)=>[`work_${i}_0`,`work_${i}_1`])]);
  for(const key of form.keys())if(!known.has(key))throw new ApiError("Campo de arquivo inesperado.",400);
  const existing=await db.from("artisan_submissions").select("id").eq("id",id).maybeSingle();
  if(existing.data)return reply({received:true,id});
  if(existing.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  const craft=await db.from("categories").select("id,name").eq("id",parsed.craft_category_id).maybeSingle();
  if(craft.error||!craft.data)throw new ApiError("Selecione um ofício disponível.",400);
  await rateLimit(request,parsed.email,"submission");
  const fieldPaths:Record<string,string>={};
  const uploaded:string[]=[];
  try {
    for(const[field,value]of form.entries()){
      if(!(value instanceof File)||!value.size)continue;
      const path=`${id}/${field}.webp`;
      const bytes=await imageBytes(value);
      const{error}=await db.storage.from("submission-media").upload(path,bytes,{contentType:"image/webp",upsert:false});
      if(error)throw new ApiError("Não foi possível armazenar as imagens.",503);
      uploaded.push(path);fieldPaths[field]=path;
    }
    const works=parsed.works.map((w,i)=>({...w,position:i,image_paths:[fieldPaths[`work_${i}_0`],fieldPaths[`work_${i}_1`]].filter(Boolean)}));
    const{error}=await db.rpc("save_submission",{p_id:id,p_data:{...parsed,craft:craft.data.name},p_portrait:fieldPaths.portrait||null,p_works:works});
    if(error)throw new ApiError("Não foi possível salvar a proposta. Tente novamente.",503);
    return reply({received:true,id},201);
  }catch(error){
    if(uploaded.length)await db.storage.from("submission-media").remove(uploaded);
    throw error;
  }
}
const storedSubmissionFilesSchema=z.array(z.object({
  field:z.string().regex(/^(portrait|work_[0-2]_[01])$/),
  type:z.enum(["image/jpeg","image/png","image/webp"]),
  size:z.number().int().min(1).max(5*1024*1024),
  path:z.string().regex(/^_incoming\/[0-9a-f-]{36}\/(portrait|work_[0-2]_[01])\.(jpg|png|webp)$/),
})).max(7);
type StoredSubmissionFile=z.infer<typeof storedSubmissionFilesSchema>[number];
type UploadSession={
  id:string;data:unknown;files:unknown;session_token_hash:string;state:"prepared"|"processing";
  expires_at:string;updated_at:string;
};
const mimeExtension:Record<StoredSubmissionFile["type"],string>={
  "image/jpeg":"jpg","image/png":"png","image/webp":"webp",
};
const sessionExpiry=()=>new Date(Date.now()+2*60*60*1000).toISOString();
const finalPath=(id:string,field:string)=>`${id}/${field}.webp`;
function newSessionToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function constantTimeEqual(left:string,right:string){
  if(left.length!==right.length)return false;
  let diff=0;
  for(let index=0;index<left.length;index++)diff|=left.charCodeAt(index)^right.charCodeAt(index);
  return diff===0;
}
async function validSessionToken(token:string|undefined,expectedHash:string){
  if(!token||token.length<32||token.length>256)return false;
  return constantTimeEqual(await digest(token),expectedHash);
}
const parseStoredFiles=(value:unknown)=>storedSubmissionFilesSchema.parse(value);
async function removeUploadSession(session:UploadSession){
  let files:StoredSubmissionFile[];
  try{files=parseStoredFiles(session.files);}catch{return false;}
  const existing=await db.from("artisan_submissions").select("id").eq("id",session.id).maybeSingle();
  if(existing.error)return false;
  const paths=files.map(file=>file.path);
  if(!existing.data)paths.push(...files.map(file=>finalPath(session.id,file.field)));
  if(paths.length){
    const removal=await db.storage.from("submission-media").remove([...new Set(paths)]);
    if(removal.error)return false;
  }
  const deleted=await db.from("submission_upload_sessions").delete().eq("id",session.id);
  return !deleted.error;
}
async function cleanupExpiredUploadSessions(){
  const expired=await db.from("submission_upload_sessions")
    .select("id,data,files,session_token_hash,state,expires_at,updated_at")
    .lt("expires_at",new Date().toISOString()).limit(20);
  if(expired.error){
    console.error("inovart-api",crypto.randomUUID(),"upload_session_cleanup_query_failed");
    return;
  }
  for(const session of (expired.data||[]) as UploadSession[]){
    if(!await removeUploadSession(session))
      console.error("inovart-api",crypto.randomUUID(),"upload_session_cleanup_failed");
  }
}
async function prepareSubmission(request:Request,body:unknown){
  const payload=z.object({
    phase:z.literal("prepare"),request_id:z.string().uuid(),data:submissionSchema,
    files:submissionFilesSchema,website:z.string().max(200).default(""),
    session_token:z.string().max(256).optional(),
  }).parse(body);
  if(payload.website)throw new ApiError("Envio recusado.",400);
  const id=payload.request_id;
  const allowed=new Set(["portrait",...payload.data.works.flatMap((_,index)=>[
    `work_${index}_0`,`work_${index}_1`,
  ])]);
  if(payload.files.some(file=>!allowed.has(file.field)))
    throw new ApiError("Campo de arquivo inesperado.",400);
  const files:StoredSubmissionFile[]=payload.files.map(file=>({
    ...file,path:`_incoming/${id}/${file.field}.${mimeExtension[file.type]}`,
  }));
  const existing=await db.from("artisan_submissions").select("id").eq("id",id).maybeSingle();
  if(existing.data)return reply({received:true,id});
  if(existing.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  const craft=await db.from("categories").select("id").eq("id",payload.data.craft_category_id).maybeSingle();
  if(craft.error||!craft.data)throw new ApiError("Selecione um ofício disponível.",400);

  const found=await db.from("submission_upload_sessions")
    .select("id,data,files,session_token_hash,state,expires_at,updated_at")
    .eq("id",id).maybeSingle();
  if(found.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  let sessionToken=payload.session_token;
  if(found.data){
    const session=found.data as UploadSession;
    if(!await validSessionToken(sessionToken,session.session_token_hash))
      throw new ApiError("Esta tentativa de envio expirou. Recarregue a página e tente novamente.",409);
    const processingFor=Date.now()-new Date(session.updated_at).getTime();
    if(session.state==="processing"&&processingFor<2*60*1000)
      throw new ApiError("O envio ainda está sendo finalizado.",409);
    const oldFiles=parseStoredFiles(session.files);
    const currentPaths=new Set(files.map(file=>file.path));
    const currentFields=new Set(files.map(file=>file.field));
    const stale=[
      ...oldFiles.filter(file=>!currentPaths.has(file.path)).map(file=>file.path),
      ...oldFiles.filter(file=>!currentFields.has(file.field)).map(file=>finalPath(id,file.field)),
    ];
    if(stale.length){
      const removal=await db.storage.from("submission-media").remove([...new Set(stale)]);
      if(removal.error)throw new ApiError("Não foi possível atualizar as imagens desta tentativa.",503);
    }
    const updated=await db.from("submission_upload_sessions").update({
      data:payload.data,files,state:"prepared",expires_at:sessionExpiry(),updated_at:new Date().toISOString(),
    }).eq("id",id);
    if(updated.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  }else{
    await rateLimit(request,payload.data.email,"submission");
    sessionToken=newSessionToken();
    const inserted=await db.from("submission_upload_sessions").insert({
      id,data:payload.data,files,client_hash:request.headers.get("x-inovart-client-hash"),
      session_token_hash:await digest(sessionToken),expires_at:sessionExpiry(),
    });
    if(inserted.error)throw new ApiError("Não foi possível preparar o envio. Tente novamente.",503);
  }
  const uploads:{field:string;path:string;token:string}[]=[];
  for(const file of files){
    const signed=await db.storage.from("submission-media").createSignedUploadUrl(file.path,{upsert:true});
    if(signed.error||!signed.data)
      throw new ApiError("Não foi possível preparar o envio das imagens.",503);
    uploads.push({field:file.field,path:file.path,token:signed.data.token});
  }
  return reply({received:false,id,session_token:sessionToken,uploads});
}
async function finalizeSubmission(body:unknown){
  const payload=z.object({
    phase:z.literal("finalize"),request_id:z.string().uuid(),
    session_token:z.string().min(32).max(256),
  }).parse(body);
  const id=payload.request_id;
  const existing=await db.from("artisan_submissions").select("id").eq("id",id).maybeSingle();
  if(existing.data)return reply({received:true,id});
  if(existing.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  const found=await db.from("submission_upload_sessions")
    .select("id,data,files,session_token_hash,state,expires_at,updated_at")
    .eq("id",id).maybeSingle();
  if(found.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  if(!found.data)throw new ApiError("Esta tentativa de envio expirou. Envie o formulário novamente.",410);
  const session=found.data as UploadSession;
  if(new Date(session.expires_at).getTime()<=Date.now()){
    await removeUploadSession(session);
    throw new ApiError("Esta tentativa de envio expirou. Envie o formulário novamente.",410);
  }
  if(!await validSessionToken(payload.session_token,session.session_token_hash))
    throw new ApiError("Acesso não autorizado.",401);
  const now=new Date().toISOString();
  const cutoff=new Date(Date.now()-2*60*1000).toISOString();
  let claim;
  if(session.state==="prepared"){
    claim=await db.from("submission_upload_sessions")
      .update({state:"processing",updated_at:now,expires_at:sessionExpiry()})
      .eq("id",id).eq("state","prepared")
      .select("id,data,files,session_token_hash,state,expires_at,updated_at").maybeSingle();
  }else{
    claim=await db.from("submission_upload_sessions")
      .update({updated_at:now,expires_at:sessionExpiry()})
      .eq("id",id).eq("state","processing").lt("updated_at",cutoff)
      .select("id,data,files,session_token_hash,state,expires_at,updated_at").maybeSingle();
  }
  if(claim.error)throw new ApiError("O recebimento está temporariamente indisponível.",503);
  if(!claim.data)throw new ApiError("O envio ainda está sendo finalizado.",409);
  const claimed=claim.data as UploadSession;
  const parsed=submissionSchema.parse(claimed.data);
  const files=parseStoredFiles(claimed.files);
  const fieldPaths:Record<string,string>={};
  const uploaded:string[]=[];
  let saved=false;
  try{
    for(const file of files){
      const download=await db.storage.from("submission-media").download(file.path);
      if(download.error||!download.data)
        throw new ApiError("Uma ou mais imagens não chegaram ao arquivo. Tente enviar novamente.",400);
      if(download.data.size!==file.size)
        throw new ApiError("Uma imagem recebida está incompleta. Tente enviar novamente.",400);
      const path=finalPath(id,file.field);
      const bytes=await imageBytes(download.data,file.type);
      const uploadedFile=await db.storage.from("submission-media")
        .upload(path,bytes,{contentType:"image/webp",upsert:true});
      if(uploadedFile.error)throw new ApiError("Não foi possível armazenar as imagens.",503);
      uploaded.push(path);fieldPaths[file.field]=path;
    }
    const works=parsed.works.map((work,index)=>({...work,position:index,
      image_paths:[fieldPaths[`work_${index}_0`],fieldPaths[`work_${index}_1`]].filter(Boolean),
    }));
    const result=await db.rpc("save_submission",{
      p_id:id,p_data:parsed,p_portrait:fieldPaths.portrait||null,p_works:works,
    });
    if(result.error)throw new ApiError("Não foi possível salvar a proposta. Tente novamente.",503);
    saved=true;
    const incoming=files.map(file=>file.path);
    const removal=incoming.length
      ?await db.storage.from("submission-media").remove(incoming)
      :{error:null};
    if(removal.error){
      await db.from("submission_upload_sessions").update({
        state:"prepared",expires_at:new Date(Date.now()-1000).toISOString(),updated_at:new Date().toISOString(),
      }).eq("id",id);
      console.error("inovart-api",crypto.randomUUID(),"completed_upload_cleanup_pending");
    }else{
      await db.from("submission_upload_sessions").delete().eq("id",id);
    }
    return reply({received:true,id},201);
  }catch(error){
    if(!saved){
      if(uploaded.length)await db.storage.from("submission-media").remove(uploaded);
      await db.from("submission_upload_sessions").update({
        state:"prepared",updated_at:new Date().toISOString(),
      }).eq("id",id);
    }
    throw error;
  }
}
async function submit(request:Request){
  if(Number(request.headers.get("content-length")||0)>128*1024)
    return reply({error:"Os dados do formulário são maiores do que o permitido."},413);
  if((request.headers.get("content-type")||"").includes("multipart/form-data"))
    return submitLegacy(request);
  await cleanupExpiredUploadSessions();
  const body=await request.json();
  if((body as {phase?:unknown})?.phase==="prepare")return prepareSubmission(request,body);
  if((body as {phase?:unknown})?.phase==="finalize")return finalizeSubmission(body);
  throw new ApiError("Etapa de envio inválida.",400);
}

async function promote(path:string,target:string) {
  const{data,error}=await db.storage.from("submission-media").download(path);
  if(error||!data)throw new ApiError("Uma imagem aprovada não está disponível.",503);
  const up=await db.storage.from("public-media").upload(target,data,{contentType:"image/webp",upsert:false});
  if(up.error)throw new ApiError("Não foi possível preparar a imagem para publicação.",503);
  return {path:target,url:db.storage.from("public-media").getPublicUrl(target).data.publicUrl};
}
type CleanupRow={id:number;object_path:string;lease_token:string;attempts:number};
async function retryPendingMediaCleanup(){
  const queue=await db.rpc("claim_media_cleanup",{p_limit:100,p_lease_seconds:120});
  if(queue.error){console.error("inovart-api",crypto.randomUUID(),"cleanup_queue_claim_failed");return false;}
  const rows=(Array.isArray(queue.data)?queue.data:[]) as CleanupRow[];
  if(!rows.length)return true;
  const lease=rows[0].lease_token;
  if(!lease||rows.some(row=>row.lease_token!==lease)){
    console.error("inovart-api",crypto.randomUUID(),"cleanup_queue_lease_invalid");return false;
  }
  const paths=[...new Set(rows.map(row=>row.object_path))];
  const removal=await db.storage.from("public-media").remove(paths);
  const completion=await db.rpc("finish_media_cleanup",{
    p_ids:rows.map(row=>row.id),p_lease_token:lease,p_error:removal.error?.message.slice(0,500)||null,
  });
  if(removal.error||completion.error||completion.data!==rows.length){
    console.error("inovart-api",crypto.randomUUID(),"media_cleanup_pending");return false;
  }
  return true;
}
async function editorial(request:Request) {
  const token=(request.headers.get("authorization")||"").replace(/^Bearer /,"");
  const{data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user||user.app_metadata?.role!=="admin")return reply({error:"Acesso editorial necessário."},403);
  const caller=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const body=await request.json();
  const id=body.id?z.string().uuid().parse(body.id):undefined;
  if(body.action==="review"){
    const status=z.enum(["under_review","approved","rejected"]).parse(body.status);
    const notes=z.string().max(3000).parse(body.notes||"");
    const{data,error}=await caller.rpc("review_submission",{p_id:id,p_status:status,p_notes:notes});
    if(error)throw new Error("Não foi possível salvar a decisão editorial.");
    return reply({artisan_id:data,status});
  }
  if(body.action==="save"){
    const parsed=editorialSchema.parse(body);
    const{data,error}=await caller.rpc("save_editorial_record",{p_table:parsed.table,p_id:id||null,p_values:parsed.values});
    if(error)throw new Error("Não foi possível salvar. Confira o endereço curto e os campos obrigatórios.");
    return reply({id:data});
  }
  if(body.action==="delete_category"){
    const{data,error}=await caller.rpc("delete_editorial_category",{p_id:id});
    if(error)throw new Error("Não foi possível excluir a categoria.");
    return reply({id:data});
  }
  if(body.action==="message_status"){
    const status=z.enum(["new","read","resolved"]).parse(body.status);
    const{data,error}=await caller.from("contact_messages").update({status}).eq("id",id).select("id").single();
    if(error)throw new Error("Mensagem não encontrada.");return reply({id:data.id,status});
  }
  if(body.action==="publish"||body.action==="archive"){
    const table=z.enum(["artisans","works"]).parse(body.table);
    const{data:record,error}=await caller.from(table).select("*").eq("id",id).single();
    if(error||!record)throw new Error("Registro não encontrado.");
    if(body.action==="archive"){
      const result=await caller.rpc("archive_editorial_record",{p_table:table,p_id:id});
      if(result.error)throw new ApiError("Não foi possível arquivar.",503);
      const cleanupPending=!(await retryPendingMediaCleanup());
      return reply({id,status:"archived",cleanup_pending:cleanupPending});
    }
    const version=crypto.randomUUID();
    const createdPaths:string[]=[];
    const media:Record<string,unknown>={};
    try{
      if(table==="artisans"&&record.source_submission_id){
        const source=await db.from("artisan_submissions").select("portrait_path,status").eq("id",record.source_submission_id).single();
        if(source.error||source.data.status!=="approved")throw new ApiError("A proposta precisa estar aprovada.",400);
        if(source.data.portrait_path){
          const uploaded=await promote(source.data.portrait_path,`artisans/${id}/${version}/portrait.webp`);
          createdPaths.push(uploaded.path);media.portrait_url=uploaded.url;
        }
      }
      if(table==="works"){
        const parent=await caller.from("artisans").select("status").eq("id",record.artisan_id).single();
        if(parent.data?.status!=="published")throw new ApiError("Publique primeiro o perfil do artesão.",400);
        if(record.source_work_id){
          const source=await db.from("submission_works").select("image_paths").eq("id",record.source_work_id).single();
          if(source.error)throw new ApiError("Material de origem não encontrado.",400);
          const items=[];
          for(let index=0;index<source.data.image_paths.length;index++){
            const uploaded=await promote(source.data.image_paths[index],`works/${id}/${version}/image-${index}.webp`);
            createdPaths.push(uploaded.path);
            items.push({url:uploaded.url,alt_text:`${record.title}, imagem ${index+1}`,position:index});
          }
          media.items=items;if(items[0])media.cover_url=items[0].url;
        }
      }
      const result=await caller.rpc("publish_editorial_record",{p_table:table,p_id:id,p_media:media});
      if(result.error)throw new ApiError("Não foi possível publicar.",503);
      const cleanupPending=!(await retryPendingMediaCleanup());
      return reply({id,status:"published",cleanup_pending:cleanupPending});
    }catch(error){
      if(createdPaths.length){
        const removal=await db.storage.from("public-media").remove(createdPaths);
        if(removal.error){
          const queued=await db.rpc("enqueue_media_cleanup",{
            p_paths:createdPaths,p_source_table:table,p_source_id:id,
          });
          if(queued.error)console.error("inovart-api",crypto.randomUUID(),"failed_publication_cleanup_enqueue_failed");
        }
      }
      throw error;
    }
  }
  return reply({error:"Ação não reconhecida."},400);
}
Deno.serve(async(request:Request)=>{
  if(request.method!=="POST")return reply({error:"Método não permitido."},405);
  try{
    if(!await checkProxy(request))return reply({error:"Acesso não autorizado."},401);
    const action=request.headers.get("x-inovart-action");
    if(action==="health"){
      await ensureMagick();
      const cleanupPending=!(await retryPendingMediaCleanup());
      return reply({ready:true,image_processor:true,cleanup_pending:cleanupPending});
    }
    if(action==="submission")return await submit(request);
    if(action==="contact"){
      const data=await request.json();
      if(data.website)return reply({error:"Envio recusado."},400);
      const parsed=contactSchema.parse(data);await rateLimit(request,parsed.email,"contact");
      const{error}=await db.from("contact_messages").insert(parsed);
      if(error)throw new ApiError("Não foi possível salvar sua mensagem.",503);
      return reply({received:true},201);
    }
    if(action==="editorial")return await editorial(request);
    return reply({error:"Ação não reconhecida."},400);
  }catch(error){
    if(error instanceof z.ZodError)return reply({error:"Confira os campos obrigatórios e os limites do formulário."},400);
    if(error instanceof ApiError)return reply({error:error.message},error.status,error.retryAfter?{"Retry-After":String(error.retryAfter)}:{});
    const incident=crypto.randomUUID();
    console.error("inovart-api",incident,error instanceof Error?error.name:"unknown");
    return reply({error:`Não foi possível concluir a operação. Referência: ${incident}`},500);
  }
});
