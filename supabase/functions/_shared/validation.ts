import { z } from "zod";
import {
  SUBMISSION_IMAGES_MAX_BYTES,
  SUBMISSION_IMAGE_MAX_BYTES,
  SUBMISSION_IMAGE_TYPES,
} from "./image-policy.ts";
export {
  assertImageDimensions,
  assertSourceImageDimensions,
  identifyImage,
  readImageDimensions,
} from "./image.ts";
export * from "./image-policy.ts";
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
export const submissionFilesSchema = z.array(z.object({
  field:z.string().regex(/^(portrait|work_[0-2]_[01])$/),
  type:z.enum(SUBMISSION_IMAGE_TYPES),
  size:z.number().int().min(1).max(SUBMISSION_IMAGE_MAX_BYTES),
})).max(7).superRefine((files,context)=>{
  const fields=new Set<string>();
  let total=0;
  for(const file of files){
    if(fields.has(file.field))context.addIssue({code:"custom",message:"Arquivo duplicado.",path:[files.indexOf(file),"field"]});
    fields.add(file.field);total+=file.size;
  }
  if(total>SUBMISSION_IMAGES_MAX_BYTES)context.addIssue({code:"custom",message:"O envio ultrapassa o limite total de 35 MB."});
});
export const editorialSchema = z.discriminatedUnion("table", [
  z.object({ table:z.literal("categories"), values:z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),description:z.string().trim().min(10).max(2000)}) }),
  z.object({ table:z.literal("artisans"), values:z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),craft_category_id:z.string().uuid(),bio:z.string().trim().min(40).max(3000),neighborhood:z.string().trim().max(120).default(""),region_withheld:z.boolean().default(false),quote:z.string().max(500).default(""),featured:z.boolean().default(false),category_ids:z.array(z.string().uuid()).max(20)}) }),
  z.object({ table:z.literal("works"), values:z.object({title:z.string().trim().min(2).max(160),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),description:z.string().trim().min(10).max(2000),artisan_id:z.string().uuid(),materials:z.array(z.string().trim().max(80)).max(15),year:z.number().int().min(1900).max(2100).nullable(),price_cents:z.number().int().min(0).max(999999999).nullable(),shipping_details:z.string().trim().max(500).default(""),featured:z.boolean().default(false),category_ids:z.array(z.string().uuid()).max(20)}) }),
]);
export function slugify(value:string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
