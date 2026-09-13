#!/usr/bin/env node
// Generates the Web Bot Auth key directory and patches it into _worker.js.
//
// The directory response itself must be signed (one signature per published key),
// which is what lets Cloudflare trust that nobody mirrored our directory.
// The private key stays in ~/.pi/secrets and never enters the repo.
//
//   node scripts/webbotauth-directory.mjs [--years 2]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGENT_ORIGIN,
  ed25519Sign,
  loadPrivateKey,
  paramsLine,
  publicJwk,
  signatureBase,
  thumbprint,
} from "./webbotauth-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(here, "..", "_worker.js");

const yearsArg = process.argv.indexOf("--years");
const years = yearsArg > -1 ? Number(process.argv[yearsArg + 1]) : 2;

const key = loadPrivateKey();
const jwk = publicJwk(key);
const keyid = thumbprint(jwk);

const now = Math.floor(Date.now() / 1000);
const expires = now + Math.round(years * 365 * 24 * 3600);

// Required by the directory draft: @authority with the `req` parameter.
const components = '"@authority";req';
const params = paramsLine(components, {
  alg: "ed25519",
  keyid,
  tag: "http-message-signatures-directory",
  created: now,
  expires,
});
const host = new URL(AGENT_ORIGIN).host;
const base = signatureBase([`"@authority";req: ${host}`], params);
const signature = `sig1=:${ed25519Sign(key, base)}:`;

const generated = `// >>> webbotauth:generated — re-run scripts/webbotauth-directory.mjs after key rotation
export const WEBBOTAUTH = {
  keyid: ${JSON.stringify(keyid)},
  contentType: "application/http-message-signatures-directory+json",
  body: ${JSON.stringify(JSON.stringify({ keys: [jwk] }, null, 2))},
  signatureInput: ${JSON.stringify(`sig1=${params}`)},
  signature: ${JSON.stringify(signature)},
};
// <<< webbotauth:generated`;

const source = fs.readFileSync(workerPath, "utf8");
const patched = source.replace(
  /\/\/ >>> webbotauth:generated[\s\S]*?\/\/ <<< webbotauth:generated/,
  generated,
);
if (patched === source) {
  console.error("markers not found in _worker.js — add them first");
  process.exit(1);
}
fs.writeFileSync(workerPath, patched);

console.log(`keyid      ${keyid}`);
console.log(`created    ${new Date(now * 1000).toISOString()}`);
console.log(`expires    ${new Date(expires * 1000).toISOString()}`);
console.log(`signature  ${signature.slice(0, 60)}...`);
console.log(`patched    ${path.relative(process.cwd(), workerPath)}`);
