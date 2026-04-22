# Plans, Entitlements & Grace Periods

## Plan Matrix

From v12 QA Cheat Sheet:

| Plan | Seats | Collections | SSO | Offline | Custom LLM | Hide Branding | Analytics Opt-out |
|---|---|---|---|---|---|---|---|
| Core | 3 (hard cap) | 50 (hard cap) | No | No | No | No | No |
| Team | 15 (addons ok) | 100 (max 200 w/ addons) | Yes | No | No | No | No |
| OIG | Unlimited | Unlimited | Yes | No | Yes | Yes | No |
| Enterprise | 50 (addons, no cap) | 200 (addons, no cap) | Yes | Yes | Yes | Yes | Yes |

- **OIG** = Open Innovation Grant (<$5M revenue AND <50 headcount), manual-only, instant issuance
- Entitlements shape defined in [types.ts](api/src/license/types.ts)

## Enforcement Philosophy

**Data is never deleted for enforcement**, only access is restricted:
- Collection exclusions (kept in DB, hidden from the app/API)
- User deactivation (account kept, login blocked)
- Resource lockdown (admin resource-resolution flow in #27180)

## Grace Periods

From v12 QA Cheat Sheet:

| Trigger | Duration | Applies to |
|---|---|---|
| v12 upgrade without a key | 30 days | any plan (onboarding) |
| License expiry | 7 days | Team |
| License expiry | 30 days | Enterprise |

**After grace expires:**
- If usage within Core limits → degraded to Core
- If usage over Core limits → resource lockdown (admin must resolve)

## Entitlement Overrides

Per-tester entitlement changes can be applied on the licensing service side via `license.entitlement_overrides`. Precedence:

```
plan entitlements → purchased addons → license entitlement overrides
```

Use `REPLACE` for final values, `ADD` to stack numeric capacity on top of the plan.

## External References

- [v12 Licensing QA Cheat Sheet (Notion)](https://www.notion.so/directus/34844a408a75803c845bff624232ec24) — full plan matrix, grace period flows, resource resolution
- [Full Pricing Model & Cost Calculator (Google Sheet)](https://docs.google.com/spreadsheets/d/1r-aWTiHhFbxglJGegr3ZLGI7UDw02S_DoS90dxi88_4/edit)
- [Licensing Options Comparison (Notion)](https://www.notion.so/directus/63da1895b35945418b8da95620022320) — hard vs soft limits discussion
