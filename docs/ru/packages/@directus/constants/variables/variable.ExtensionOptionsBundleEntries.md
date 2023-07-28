---
editLink: false
---

# Variable: ExtensionOptionsBundleEntries

> `const` **ExtensionOptionsBundleEntries**: `ZodArray`\< `ZodUnion`\< [`ZodObject`\< \{`name`: `ZodString`; `source`:
> `ZodString`; `type`: `ZodUnion`\< [`ZodEnum`\< [`"interface"`, `"display"`, `"layout"`, `"module"`, `"panel"`] \>,
> `ZodEnum`\< [`"hook"`, `"endpoint"`] \>] \>;}, `"strip"`, `ZodTypeAny`, \{`name`: `string`; `source`: `string`;
> `type`: `"interface"` \| `"display"` \| `"layout"` \| `"module"` \| `"panel"` \| `"hook"` \| `"endpoint"`;}, \{`name`:
> `string`; `source`: `string`; `type`: `"interface"` \| `"display"` \| `"layout"` \| `"module"` \| `"panel"` \|
> `"hook"` \| `"endpoint"`;} \>, `ZodObject`\< \{`name`: `ZodString`; `source`: `ZodObject`\< \{`api`: `ZodString`;
> `app`: `ZodString`;}, `"strip"`, `ZodTypeAny`, \{`api`: `string`; `app`: `string`;}, \{`api`: `string`; `app`:
> `string`;} \>; `type`: `ZodEnum`\< [`"operation"`] \>;}, `"strip"`, `ZodTypeAny`, \{`name`: `string`; `source`:
> `{ app: string; api: string; }`; `type`: `"operation"`;}, \{`name`: `string`; `source`:
> `{ app: string; api: string; }`; `type`: `"operation"`;} \>] \>, `"many"` \>

## Source

[packages/constants/src/extensions.ts:74](https://github.com/directus/directus/blob/7789a6c53/packages/constants/src/extensions.ts#L74)
