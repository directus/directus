# Plans, Entitlements & Grace Periods

Plan tiers, limits, feature gates, and grace period rules are maintained in the internal v12 Licensing QA Cheat Sheet. Not duplicated here because this file is public.

## Enforcement Philosophy

**Data is never deleted for enforcement**, only access is restricted:
- Collection exclusions (kept in DB, hidden from the app/API)
- User deactivation (account kept, login blocked)
- Resource lockdown (admin resource-resolution flow in #27180)

Entitlements shape defined in [types.ts](api/src/license/types.ts).

## Entitlement Overrides

Per-tester entitlement changes can be applied on the licensing service side via `license.entitlement_overrides`. Precedence:

```
plan entitlements → purchased addons → license entitlement overrides
```

Use `REPLACE` for final values, `ADD` to stack numeric capacity on top of the plan.
