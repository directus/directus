# FAPI 2.0 Blackbox Test Fixture

Keycloak 26 realm pre-configured for FAPI 2.0 Security Profile: PAR (required) + PKCE S256 + DPoP-bound access tokens +
`private_key_jwt` client auth.

**Why per-client attributes instead of the built-in `fapi-2-dpop-security-profile` policy?** Keycloak's built-in
policy's `secure-client-uris` executor rejects non-HTTPS redirect URIs. Per-client attributes enforce the same protocol
requirements without blocking `http://localhost`.

## Quick start

### 1. Generate RP keys

```bash
node -e "
const { generateKeyPairSync } = require('crypto');

// Signing key (ES256)
const sig = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const sigPriv = sig.privateKey.export({ format: 'jwk' });
const sigPub  = sig.publicKey.export({ format: 'jwk' });

// Encryption key (ECDH-ES+A256KW — used for id_token JWE if Keycloak is configured to encrypt)
const enc = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const encPriv = enc.privateKey.export({ format: 'jwk' });

console.log('# Put this in AUTH_FAPI2TEST_CLIENT_PRIVATE_KEYS:');
console.log(JSON.stringify([
  { ...sigPriv,  kid: 'sig-1',  use: 'sig', alg: 'ES256' },
  { ...encPriv,  kid: 'enc-1',  use: 'enc', alg: 'ECDH-ES+A256KW' },
]));

console.log('\n# Public JWKS (register in Keycloak client -> Keys -> Use JWKS URL or paste here):');
console.log(JSON.stringify({ keys: [
  { ...sigPub,  kid: 'sig-1',  use: 'sig', alg: 'ES256' },
] }));
"
```

### 2. Start Keycloak

```bash
cd tests/blackbox/auth/fapi2
docker compose up -d
# wait for http://localhost:9090/realms/fapi2/.well-known/openid-configuration to respond
```

The realm export pre-registers the client to fetch its JWKS from
`http://host.docker.internal:8055/auth/login/fapi2test/jwks.json` — no manual click-through in the Keycloak admin UI is
required. If you're running Directus outside Docker on a host that doesn't resolve `host.docker.internal`, override the
URL via the admin UI or update the client `attributes.jwks.url` in `realm-export.json` before booting Keycloak.

### 3. Configure Directus `.env` (or `.env.test`)

```dotenv
AUTH_PROVIDERS=fapi2test
AUTH_FAPI2TEST_DRIVER=fapi
AUTH_FAPI2TEST_ISSUER_URL=http://localhost:9090/realms/fapi2
AUTH_FAPI2TEST_CLIENT_ID=directus-fapi2-client
AUTH_FAPI2TEST_CLIENT_TOKEN_ENDPOINT_AUTH_METHOD=private_key_jwt
AUTH_FAPI2TEST_CLIENT_ID_TOKEN_SIGNED_RESPONSE_ALG=ES256
AUTH_FAPI2TEST_SCOPE=openid email profile
AUTH_FAPI2TEST_ALLOW_PUBLIC_REGISTRATION=true
# Keycloak emits a flat `sub` claim, so the fixture uses `sub` here. The driver
# flattens `userInfo`, so a dot-path identifierKey also works against IdPs that
# nest identity claims one level deep.
AUTH_FAPI2TEST_IDENTIFIER_KEY=sub
# AUTH_FAPI2TEST_IDENTIFIER_KEY=sub_attributes.identity_number   # ← nested example
AUTH_FAPI2TEST_MODE=session
# Paste the JSON array from step 1:
AUTH_FAPI2TEST_CLIENT_PRIVATE_KEYS=json:[{"kty":"EC",...}]
```

### 4. Start Directus and verify

```bash
cd api && pnpm dev
```

- `GET http://localhost:8055/auth/login/fapi2test/jwks.json` → public JWKS (no `d` field)
- `GET http://localhost:8055/auth/login/fapi2test/` → should redirect to Keycloak's authorize endpoint with only
  `client_id` + `request_uri` in the URL (PAR redirect)
- Complete login as `testuser / Test@password1`
- Confirm redirect back to Directus and a `directus_users` row with `provider='fapi2test'`

### Test user

| Field    | Value                |
| -------- | -------------------- |
| Username | testuser             |
| Password | Test@password1       |
| Email    | testuser@example.com |

### Conformance suite (pre-PR only, not CI)

Run the OpenID Foundation FAPI 2.0 **RP-side** test plan against a live Directus instance. Plan name:
`fapi2-security-profile-id2-client-test-plan` (verify exact name at PR time — names drift across conformance-suite
releases; check the openid-foundation/conformance-suite repo). Attach the green-tick screenshot to the PR description
and explicitly note "RP-side plan" to avoid reviewers accidentally running the OP-side plan.

### Multi-replica note

CI only tests restart resilience (kill+restart `keycloak-postgres` then retry refresh). Multi-replica correctness is
implied by the same `auth_data` round-trip but not explicitly exercised. Add a two-replica Directus service behind an
nginx upstream to a follow-up PR if needed.
