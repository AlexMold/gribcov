# auth.md

Agent authentication and registration for `gribcov.me`.

This document follows the auth.md discovery structure so an agent can walk it
top to bottom and stop at the first step that applies. This service issues no
credentials, so the walk is short.

- **Service:** gribcov.me — personal site of Alexandr Gribcov
- **Audience:** AI agents, assistants and crawlers reading public content
- **Registration supported:** no. Anonymous access is the complete contract.
- **Credentials issued:** none

## Step 1 — Discover

No Protected Resource Metadata is published, and no Authorization Server
metadata exists, because this host protects no resources:

- `GET https://gribcov.me/.well-known/oauth-protected-resource` → not published
- `GET https://gribcov.me/.well-known/oauth-authorization-server` → not published

Their absence is accurate, not an oversight: there is no authorization server
to advertise. Discovery that does exist:

| Resource | Description |
| --- | --- |
| `GET /` | Homepage. HTML by default, Markdown with `Accept: text/markdown`. |
| `GET /llms.txt` | LLM context file: role, track record, stack, contacts. |
| `GET /openapi.json` | OpenAPI 3.1 description of the public resources. |
| `GET /.well-known/api-catalog` | API catalog (RFC 9727). |
| `GET /sitemap.xml` | Sitemap of public pages. |

## Step 2 — Pick a method

| Identity type | Supported | Why |
| --- | --- | --- |
| `anonymous` | yes | Every public resource is readable with no credential. |
| `service_auth` (verified email) | no | No accounts exist and none can be created. |
| `identity_assertion` (ID-JAG) | no | No registration or token endpoint exists to accept one. |

## Step 3 — Register

No registration endpoint exists and no `register_uri` is published, because
there is nothing to register for: this host issues no accounts, API keys or
tokens. Do not probe `POST /agent/identity` or `POST /agent/auth` — they are not
implemented, and their absence is intentional.

An agent that needs nothing beyond public content is already done: fetch the
resources in Step 1 with no credential.

If the request comes from a human who needs something beyond public content
(contract work, advisory, collaboration), provisioning is human-initiated — the
only supported registration path:

| Channel | Address |
| --- | --- |
| Book a 15-min call | https://cal.com/alexandr-gribcov-o0xrlq/15min |
| Email | alex@gribcov.me |
| Telegram | https://t.me/alegrib |
| LinkedIn | https://www.linkedin.com/in/alexmold/ |

## Step 4 — Use the credential

There is no credential to use, present or refresh. Anonymous access is the whole
mechanism.

## Errors

| Situation | What it means |
| --- | --- |
| `401` from this host | Should not occur. No resource here requires authentication. If you receive one, treat it as a misconfiguration and fall back to the public resources in Step 1. |
| `404` on `/.well-known/oauth-*` | Expected. No OAuth metadata is published. |
| `404` on `POST /agent/identity` | Expected. No registration endpoint exists. |

## Revocation

Not applicable: no credential is issued, so there is nothing to revoke and no
`revocation_uri` to call.

## Usage preferences

Crawling and AI usage preferences are declared in `/robots.txt`
(`Content-Signal: ai-train=yes, search=yes, ai-input=yes`).
