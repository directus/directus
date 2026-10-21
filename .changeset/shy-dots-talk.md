---
'@directus/specs': major
'@directus/api': major
---

Renamed the OpenAPI schema `x-metadata` to `Metadata` for consistency with other schema names

::: notice

List responses now reference `#/components/schemas/Metadata` for `meta`, in both `@directus/specs` and `/server/specs/oas`. Update any `$ref` to `x-metadata` and regenerate clients built from the spec.

:::
