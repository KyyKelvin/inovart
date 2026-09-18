import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const readProjectFile = (path) => readFile(
  fileURLToPath(new URL(`../${path}`, import.meta.url)),
  "utf8",
);

test("starts Google OAuth without exposing the administrator allowlist", async () => {
  const login = await readProjectFile("components/admin-login.tsx");

  assert.match(login, /provider:\s*"google"/);
  assert.match(login, /window\.location\.origin}\/auth\/callback/);
  assert.match(login, /prompt:\s*"select_account"/);
  assert.doesNotMatch(login, /inovartpy@gmail\.com|kelvinky\.augusto@gmail\.com/i);
  assert.doesNotMatch(login, /service_role|proxy_token|client_secret/i);
});

test("clears the OAuth code and authorizes only app metadata admins", async () => {
  const callback = await readProjectFile("app/auth/callback/page.tsx");

  assert.match(callback, /history\.replaceState\(null,\s*"",\s*"\/auth\/callback"\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /app_metadata\?\.role\s*!==\s*"admin"/);
  assert.match(callback, /client\.auth\.signOut\(\)/);
  assert.doesNotMatch(callback, /console\.(?:log|error)|error\.message/);
});
