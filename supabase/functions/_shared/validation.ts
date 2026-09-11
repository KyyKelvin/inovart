import { z } from "zod";
export const contactSchema = z.object({
  name:z.string().trim().min(2).max(120), email:z.string().trim().email().max(254),
  subject:z.string().trim().min(2).max(160), message:z.string().trim().min(10).max(3000),
});
export const submissionSchema = z.object({
  name:z.string().trim().min(2).max(120), craft:z.string().trim().min(2).max(120),
  neighborhood:z.string().trim().max(120).default(""), bio:z.string().trim().min(40).max(3000),
  email:z.string().trim().email().max(254), phone:z.string().trim().max(32).default(""),
  instagram:z.string().trim().max(100).default(""), consent:z.literal(true),
  public_email:z.boolean().default(false), public_phone:z.boolean().default(false), public_instagram:z.boolean().default(false),
  works:z.array(z.object({ title:z.string().trim().min(2).max(160), description:z.string().trim().min(10).max(2000),
    materials:z.array(z.string().trim().min(1).max(80)).max(15) })).min(1).max(3),
});
export const editorialSchema = z.discriminatedUnion("table", [
  z.object({ table:z.literal("categories"), values:z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),description:z.string().trim().min(10).max(2000)}) }),
  z.object({ table:z.literal("artisans"), values:z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),craft:z.string().trim().min(2).max(120),bio:z.string().trim().min(40).max(3000),neighborhood:z.string().max(120).default(""),quote:z.string().max(500).default(""),featured:z.boolean().default(false),category_ids:z.array(z.string().uuid()).max(20)}) }),
  z.object({ table:z.literal("works"), values:z.object({title:z.string().trim().min(2).max(160),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),description:z.string().trim().min(10).max(2000),artisan_id:z.string().uuid(),materials:z.array(z.string().trim().max(80)).max(15),year:z.number().int().min(1900).max(2100).nullable(),featured:z.boolean().default(false),category_ids:z.array(z.string().uuid()).max(20)}) }),
]);
export function slugify(value:string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
export function identifyImage(bytes:Uint8Array) {
  if (bytes.length < 12 || bytes.length > 5*1024*1024) throw new Error("A imagem deve ter até 5 MB.");
  if (bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) return "image/png";
  if ([82,73,70,70].every((v,i)=>bytes[i]===v) && [87,69,66,80].every((v,i)=>bytes[i+8]===v)) return "image/webp";
  throw new Error("Use uma imagem JPEG, PNG ou WebP válida.");
}
