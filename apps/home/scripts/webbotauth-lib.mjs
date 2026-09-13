// Web Bot Auth signing helpers (RFC 9421 HTTP Message Signatures, Ed25519).
// Specs:
//   https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
//   https://datatracker.ietf.org/doc/draft-meunier-http-message-signatures-directory/
import crypto from "node:crypto";
import fs from "node:fs";

export const DEFAULT_KEY_PATH =
  process.env.WEBBOTAUTH_KEY || `${process.env.HOME}/.pi/secrets/webbotauth-ed25519.pem`;
export const AGENT_ORIGIN = process.env.WEBBOTAUTH_AGENT || "https://gribcov.me";
export const DIRECTORY_PATH = "/.well-known/http-message-signatures-directory";

export function loadPrivateKey(path = DEFAULT_KEY_PATH) {
  return crypto.createPrivateKey(fs.readFileSync(path, "utf8"));
}

/** Public half as a JWK. Only kty/crv/x are published (never `d`). */
export function publicJwk(privateKey) {
  const { x } = crypto.createPublicKey(privateKey).export({ format: "jwk" });
  return { kty: "OKP", crv: "Ed25519", x };
}

/** RFC 7638 JWK thumbprint, base64url — this is the `keyid`. */
export function thumbprint(jwk) {
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  return crypto.createHash("sha256").update(canonical).digest("base64url");
}

/** RFC 9421 signature base: one line per covered component, then @signature-params. */
export function signatureBase(componentLines, paramsLine) {
  return [...componentLines, `"@signature-params": ${paramsLine}`].join("\n");
}

export function ed25519Sign(privateKey, base) {
  return crypto.sign(null, Buffer.from(base, "ascii"), privateKey).toString("base64");
}

export function ed25519Verify(publicKey, base, signatureB64) {
  return crypto.verify(null, Buffer.from(base, "ascii"), publicKey, Buffer.from(signatureB64, "base64"));
}

/**
 * Signature-Input params line. Numbers stay unquoted, strings quoted, per RFC 8941.
 * `extra` is inserted before tag, for flow-specific parameters.
 */
export function paramsLine(components, { alg, keyid, tag, created, expires, nonce, extra = [] }) {
  const parts = [`(${components})`, ...extra, `alg="${alg}"`, `keyid="${keyid}"`];
  if (nonce) parts.push(`nonce="${nonce}"`);
  parts.push(`tag="${tag}"`, `created=${created}`, `expires=${expires}`);
  return parts.join(";");
}
