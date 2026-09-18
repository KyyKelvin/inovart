import test from "node:test";
import assert from "node:assert/strict";
import { contactSchema, submissionSchema, editorialSchema, slugify, identifyImage, readImageDimensions, assertImageDimensions } from "../supabase/functions/_shared/validation.ts";
import { createLimitedBodyStream } from "../lib/request-stream.ts";
import { createStreamingRequest } from "../lib/streaming-request.ts";

const png=(width,height,ihdrLength=13)=>{
  const bytes=new Uint8Array(33);
  bytes.set([137,80,78,71,13,10,26,10],0);
  new DataView(bytes.buffer).setUint32(8,ihdrLength);
  bytes.set([73,72,68,82],12);
  new DataView(bytes.buffer).setUint32(16,width);
  new DataView(bytes.buffer).setUint32(20,height);
  return bytes;
};
const jpeg=(width,height,marker=0xc0,length=17)=>{
  const bytes=new Uint8Array(2+2+length+2);
  bytes.set([0xff,0xd8,0xff,marker,length>>8,length&0xff],0);
  if(length>=8)bytes.set([8,height>>8,height&0xff,width>>8,width&0xff,3],6);
  if(length>=17)bytes.set([1,17,0,2,17,0,3,17,0],12);
  bytes.set([0xff,0xd9],bytes.length-2);
  return bytes;
};
const webp=(chunk,data)=>{
  const padding=data.length%2;
  const bytes=new Uint8Array(12+8+data.length+padding);
  bytes.set([82,73,70,70],0);
  new DataView(bytes.buffer).setUint32(4,bytes.length-8,true);
  bytes.set([87,69,66,80],8);
  bytes.set([...chunk].map(char=>char.charCodeAt(0)),12);
  new DataView(bytes.buffer).setUint32(16,data.length,true);
  bytes.set(data,20);
  return bytes;
};
const vp8x=(width,height,flags=0)=>webp("VP8X",Uint8Array.from([flags,0,0,0,(width-1)&255,((width-1)>>8)&255,((width-1)>>16)&255,(height-1)&255,((height-1)>>8)&255,((height-1)>>16)&255]));
const vp8=(width,height)=>webp("VP8 ",Uint8Array.from([0,0,0,0x9d,0x01,0x2a,width&255,(width>>8)&0x3f,height&255,(height>>8)&0x3f]));
const vp8l=(width,height)=>{
  const w=width-1,h=height-1;
  return webp("VP8L",Uint8Array.from([0x2f,w&255,((w>>8)&0x3f)|((h&3)<<6),(h>>2)&255,(h>>10)&0x0f]));
};

const proposal = {
  name: "Pessoa de teste", craft: "Cerâmica", bio: "Uma trajetória de teste com mais de quarenta caracteres para validação.",
  email: "test@example.com", consent: true,
  works: [{ title: "Peça de teste", description: "Uma descrição de teste.", materials: ["Barro"] }],
};
test("accepts a complete proposal and keeps public contacts private by default", () => {
  const data = submissionSchema.parse(proposal);
  assert.equal(data.public_email, false); assert.equal(data.public_phone, false); assert.equal(data.public_instagram, false);
});
test("requires consent and rejects excess works", () => {
  assert.equal(submissionSchema.safeParse({ ...proposal, consent: false }).success, false);
  assert.equal(submissionSchema.safeParse({ ...proposal, works: Array(4).fill(proposal.works[0]) }).success, false);
});
test("rejects incomplete biographies and malformed contact details", () => {
  assert.equal(submissionSchema.safeParse({ ...proposal, bio: "curta" }).success, false);
  assert.equal(submissionSchema.safeParse({ ...proposal, email: "invalid" }).success, false);
  assert.equal(contactSchema.safeParse({ name: "Teste", email: "test@example.com", subject: "A", message: "x" }).success, false);
});
test("strips attempts to set editorial status or administrative metadata", () => {
  const parsed = submissionSchema.parse({ ...proposal, status: "published", reviewed_by: "attacker", app_metadata: { role: "admin" } });
  assert.equal("status" in parsed, false); assert.equal("reviewed_by" in parsed, false); assert.equal("app_metadata" in parsed, false);
});
test("only accepts real image signatures, independently of filename", () => {
  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
  const jpeg = Uint8Array.from([255,216,255,0,0,0,0,0,0,0,0,0]);
  const webp = Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]);
  assert.equal(identifyImage(png), "image/png"); assert.equal(identifyImage(jpeg), "image/jpeg"); assert.equal(identifyImage(webp), "image/webp");
  assert.throws(() => identifyImage(new TextEncoder().encode("<script>fake.jpg</script>")));
  assert.throws(() => identifyImage(new Uint8Array(5*1024*1024+1)));
});
test("reads image dimensions before decoding and rejects oversized pixels", () => {
  for(const image of [png(4000,3000),jpeg(4000,3000),jpeg(4000,3000,0xc2),vp8x(4000,3000),vp8(4000,3000),vp8l(4000,3000)]){
    assert.deepEqual(readImageDimensions(image),{width:4000,height:3000});
    assert.deepEqual(assertImageDimensions(image),{width:4000,height:3000});
  }
  for(const image of [png(4001,3000),jpeg(4001,3000),vp8x(4001,3000),vp8(4001,3000),vp8l(4001,3000)])
    assert.throws(()=>assertImageDimensions(image),/12 megapixels/);
});
test("rejects malformed image dimension structures", () => {
  assert.throws(()=>readImageDimensions(png(4000,3000,12)),/PNG/);
  assert.throws(()=>readImageDimensions(png(0,3000)),/dimensões/);
  assert.throws(()=>readImageDimensions(png(4000,3000).slice(0,24)),/PNG/);
  assert.throws(()=>readImageDimensions(jpeg(4000,3000,0xc0,7)),/JPEG/);
  const brokenJpeg=jpeg(4000,3000);brokenJpeg[4]=0xff;
  assert.throws(()=>readImageDimensions(brokenJpeg),/JPEG/);
  const brokenRiff=vp8x(4000,3000);brokenRiff[4]--;
  assert.throws(()=>readImageDimensions(brokenRiff),/RIFF/);
  assert.throws(()=>readImageDimensions(vp8x(4000,3000,0x02)),/animado/);
  assert.throws(()=>assertImageDimensions(png(16385,1)),/dimensões/);
});
test("streams request bodies up to the exact limit and stops oversized chunks", async () => {
  const stream=chunks=>new ReadableStream({start(controller){for(const chunk of chunks)controller.enqueue(Uint8Array.from(chunk));controller.close();}});
  const exact=createLimitedBodyStream(stream([[1,2],[3,4]]),4);
  assert.deepEqual(new Uint8Array(await new Response(exact.body).arrayBuffer()),Uint8Array.from([1,2,3,4]));
  assert.equal(exact.exceeded(),false);
  const oversized=createLimitedBodyStream(stream([[1,2],[3,4,5]]),4);
  await assert.rejects(()=>new Response(oversized.body).arrayBuffer(),/request body limit exceeded/);
  assert.equal(oversized.exceeded(),true);
});
test("constructs a Node-compatible request from a streamed body", async () => {
  const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode("{}"));controller.close();}});
  const request=createStreamingRequest("https://example.com/api",{method:"POST",body});
  assert.equal(request.method,"POST");
  assert.equal(await request.text(),"{}");
});
test("editorial saves cannot directly change publication status", () => {
  const parsed = editorialSchema.parse({table:"categories",values:{name:"Cerâmica",slug:"ceramica",description:"Peças artesanais em cerâmica.",status:"published"}});
  assert.equal("status" in parsed.values, false);
  assert.equal(editorialSchema.safeParse({ table: "auth.users", values: {} }).success, false);
});
test("generates safe slugs from Portuguese titles", () => {
  assert.equal(slugify("  Cerâmica & memória  "), "ceramica-memoria");
});
