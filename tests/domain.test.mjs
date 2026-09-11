import test from "node:test";
import assert from "node:assert/strict";
import { contactSchema, submissionSchema, editorialSchema, slugify, identifyImage } from "../supabase/functions/_shared/validation.ts";

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
test("editorial saves cannot directly change publication status", () => {
  const parsed = editorialSchema.parse({table:"categories",values:{name:"Cerâmica",slug:"ceramica",description:"Peças artesanais em cerâmica.",status:"published"}});
  assert.equal("status" in parsed.values, false);
  assert.equal(editorialSchema.safeParse({ table: "auth.users", values: {} }).success, false);
});
test("generates safe slugs from Portuguese titles", () => {
  assert.equal(slugify("  Cerâmica & memória  "), "ceramica-memoria");
});
