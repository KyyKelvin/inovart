import { z } from "zod";
export const contactSchema = z.object({
  name:z.string().trim().min(2).max(120), email:z.string().trim().email().max(254),
  subject:z.string().trim().min(2).max(160), message:z.string().trim().min(10).max(3000),
});
export const submissionSchema = z.object({
  name:z.string().trim().min(2).max(120), craft_category_id:z.string().uuid(),
  neighborhood:z.string().trim().max(120).default(""), region_withheld:z.boolean().default(false), bio:z.string().trim().min(40).max(3000),
  email:z.string().trim().email().max(254), phone:z.string().trim().max(32).default(""),
  instagram:z.string().trim().max(100).default(""), consent:z.literal(true),
  public_email:z.boolean().default(false), public_phone:z.boolean().default(false), public_instagram:z.boolean().default(false),
  works:z.array(z.object({ title:z.string().trim().min(2).max(160), description:z.string().trim().min(10).max(2000),
    materials:z.array(z.string().trim().min(1).max(80)).max(15), price_cents:z.number().int().min(0).max(999999999).nullable().default(null),
    shipping_details:z.string().trim().max(500).default("") })).min(1).max(3),
});
export const editorialSchema = z.discriminatedUnion("table", [
  z.object({ table:z.literal("categories"), values:z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),description:z.string().trim().min(10).max(2000)}) }),
  z.object({ table:z.literal("artisans"), values:z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),craft_category_id:z.string().uuid(),bio:z.string().trim().min(40).max(3000),neighborhood:z.string().trim().max(120).default(""),region_withheld:z.boolean().default(false),quote:z.string().max(500).default(""),featured:z.boolean().default(false),category_ids:z.array(z.string().uuid()).max(20)}) }),
  z.object({ table:z.literal("works"), values:z.object({title:z.string().trim().min(2).max(160),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),description:z.string().trim().min(10).max(2000),artisan_id:z.string().uuid(),materials:z.array(z.string().trim().max(80)).max(15),year:z.number().int().min(1900).max(2100).nullable(),price_cents:z.number().int().min(0).max(999999999).nullable(),shipping_details:z.string().trim().max(500).default(""),featured:z.boolean().default(false),category_ids:z.array(z.string().uuid()).max(20)}) }),
]);
export function slugify(value:string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
export function identifyImage(bytes:Uint8Array) {
  if (bytes.length < 12 || bytes.length > 5*1024*1024) throw new Error("A imagem deve ter atÃƒÆ’Ã‚Â© 5 MB.");
  if (bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) return "image/png";
  if ([82,73,70,70].every((v,i)=>bytes[i]===v) && [87,69,66,80].every((v,i)=>bytes[i+8]===v)) return "image/webp";
  throw new Error("Use uma imagem JPEG, PNG ou WebP vÃƒÆ’Ã‚Â¡lida.");
}

type ImageDimensions = { width:number; height:number };
const jpegSizeMarkers=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
const validDimensions=(width:number,height:number):ImageDimensions=>{
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw new Error("NÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel ler as dimensÃƒÆ’Ã‚Âµes da imagem.");
  return {width,height};
};
const uint24le=(bytes:Uint8Array,offset:number)=>bytes[offset]|(bytes[offset+1]<<8)|(bytes[offset+2]<<16);
const uint32le=(bytes:Uint8Array,offset:number)=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(offset,true);

export function readImageDimensions(bytes:Uint8Array):ImageDimensions {
  const mime=identifyImage(bytes);
  if(mime==="image/png"){
    if(bytes.length<33||new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(8)!==13||String.fromCharCode(...bytes.slice(12,16))!=="IHDR")throw new Error("PNG sem cabeÃƒÆ’Ã‚Â§alho de dimensÃƒÆ’Ã‚Âµes vÃƒÆ’Ã‚Â¡lido.");
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    return validDimensions(view.getUint32(16),view.getUint32(20));
  }
  if(mime==="image/jpeg"){
    let cursor=2;
    while(cursor<bytes.length){
      if(bytes[cursor]!==0xff)throw new Error("JPEG com estrutura invÃƒÆ’Ã‚Â¡lida.");
      while(cursor<bytes.length&&bytes[cursor]===0xff)cursor++;
      if(cursor>=bytes.length)break;
      const marker=bytes[cursor++];
      if(marker===0x00)throw new Error("JPEG com marcador invÃƒÆ’Ã‚Â¡lido.");
      if(marker===0xd9||marker===0xda)break;
      if(marker===0xd8||marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
      if(cursor+1>=bytes.length)break;
      const length=(bytes[cursor]<<8)|bytes[cursor+1];
      if(length<2||cursor+length>bytes.length)break;
      if(jpegSizeMarkers.has(marker)){
        if(length<8)throw new Error("JPEG com segmento de dimensÃƒÆ’Ã‚Âµes invÃƒÆ’Ã‚Â¡lido.");
        const components=bytes[cursor+7];
        if(components<1||length!==8+3*components)throw new Error("JPEG com segmento de dimensÃƒÆ’Ã‚Âµes invÃƒÆ’Ã‚Â¡lido.");
        return validDimensions((bytes[cursor+5]<<8)|bytes[cursor+6],(bytes[cursor+3]<<8)|bytes[cursor+4]);
      }
      cursor+=length;
    }
    throw new Error("JPEG sem cabeÃƒÆ’Ã‚Â§alho de dimensÃƒÆ’Ã‚Âµes vÃƒÆ’Ã‚Â¡lido.");
  }
  if(bytes.length!==uint32le(bytes,4)+8)throw new Error("WebP com tamanho RIFF invÃƒÆ’Ã‚Â¡lido.");
  let cursor=12;
  let canvasDimensions:ImageDimensions|undefined;
  let imageDimensions:ImageDimensions|undefined;
  while(cursor<bytes.length){
    if(cursor+8>bytes.length)throw new Error("WebP com cabeÃƒÆ’Ã‚Â§alho de bloco truncado.");
    const chunk=String.fromCharCode(...bytes.slice(cursor,cursor+4));
    const size=uint32le(bytes,cursor+4);
    const data=cursor+8;
    const dataEnd=data+size;
    const next=dataEnd+(size%2);
    if(dataEnd>bytes.length||next>bytes.length)throw new Error("WebP com bloco truncado.");
    if(chunk==="ANIM"||chunk==="ANMF")throw new Error("WebP animado nÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© permitido.");
    if(chunk==="VP8X"){
      if(size!==10||bytes[data+1]!==0||bytes[data+2]!==0||bytes[data+3]!==0)throw new Error("WebP com cabeÃƒÆ’Ã‚Â§alho estendido invÃƒÆ’Ã‚Â¡lido.");
      if((bytes[data]&0x02)!==0)throw new Error("WebP animado nÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© permitido.");
      if(canvasDimensions)throw new Error("WebP com mÃƒÆ’Ã‚Âºltiplos cabeÃƒÆ’Ã‚Â§alhos estendidos.");
      canvasDimensions=validDimensions(uint24le(bytes,data+4)+1,uint24le(bytes,data+7)+1);
    }
    if(chunk==="VP8L"&&size>=5&&data+5<=bytes.length&&bytes[data]===0x2f){
      if((bytes[data+4]>>5)!==0)throw new Error("WebP lossless com versÃƒÆ’Ã‚Â£o invÃƒÆ’Ã‚Â¡lida.");
      const width=1+bytes[data+1]+((bytes[data+2]&0x3f)<<8);
      const height=1+((bytes[data+2]&0xc0)>>6)+(bytes[data+3]<<2)+((bytes[data+4]&0x0f)<<10);
      if(imageDimensions)throw new Error("WebP com mÃƒÆ’Ã‚Âºltiplos blocos de imagem.");
      imageDimensions=validDimensions(width,height);
    }
    if(chunk==="VP8 "&&size>=10&&data+10<=bytes.length&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a){
      if((bytes[data]&1)!==0)throw new Error("WebP lossy sem quadro-chave vÃƒÆ’Ã‚Â¡lido.");
      if(imageDimensions)throw new Error("WebP com mÃƒÆ’Ã‚Âºltiplos blocos de imagem.");
      imageDimensions=validDimensions((bytes[data+6]|(bytes[data+7]<<8))&0x3fff,(bytes[data+8]|(bytes[data+9]<<8))&0x3fff);
    }
    cursor=next;
  }
  if(canvasDimensions&&imageDimensions&&(canvasDimensions.width!==imageDimensions.width||canvasDimensions.height!==imageDimensions.height))throw new Error("WebP com dimensÃƒÆ’Ã‚Âµes inconsistentes.");
  if(canvasDimensions||imageDimensions)return (canvasDimensions||imageDimensions)!;
  throw new Error("WebP sem cabeÃƒÆ’Ã‚Â§alho de dimensÃƒÆ’Ã‚Âµes vÃƒÆ’Ã‚Â¡lido.");
}

export function assertImageDimensions(bytes:Uint8Array,maxPixels=12_000_000,maxSide=16_384):ImageDimensions {
  const dimensions=readImageDimensions(bytes);
  if(dimensions.width>maxSide||dimensions.height>maxSide)throw new Error("A imagem excede o limite de dimensÃƒÆ’Ã‚Âµes.");
  if(dimensions.width>Math.floor(maxPixels/dimensions.height))throw new Error("A imagem excede 12 megapixels.");
  return dimensions;
}
