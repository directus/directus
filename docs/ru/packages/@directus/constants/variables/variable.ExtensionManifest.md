---
editLink: false
---

# Variable: ExtensionManifest

> `const` **ExtensionManifest**: `ZodObject`\< \{`dependencies`: `ZodOptional`\< `ZodRecord`\< `ZodString`, `ZodString`
> \> \>; `directus:extension`: `ZodIntersection`\< `ZodObject`\< \{`hidden`: `ZodOptional`\< `ZodBoolean` \>; `host`:
> `ZodString`;}, `"strip"`, `ZodTypeAny`, \{`hidden`: `boolean`; `host`: `string`;}, \{`hidden`: `boolean`; `host`:
> `string`;} \>, `ZodUnion`\< [`ZodObject`\< \{`path`: `ZodString`; `source`: `ZodString`; `type`: `ZodUnion`\<
> [`ZodEnum`\< [`"interface"`, `"display"`, `"layout"`, `"module"`, `"panel"`] \>, `ZodEnum`\< [`"hook"`, `"endpoint"`]
> \>] \>;}, `"strip"`, `ZodTypeAny`, \{`path`: `string`; `source`: `string`; `type`: `"interface"` \| `"display"` \|
> `"layout"` \| `"module"` \| `"panel"` \| `"hook"` \| `"endpoint"`;}, \{`path`: `string`; `source`: `string`; `type`:
> `"interface"` \| `"display"` \| `"layout"` \| `"module"` \| `"panel"` \| `"hook"` \| `"endpoint"`;} \>, `ZodObject`\<
> \{`path`: `ZodObject`\< \{`api`: `ZodString`; `app`: `ZodString`;}, `"strip"`, `ZodTypeAny`, \{`api`: `string`; `app`:
> `string`;}, \{`api`: `string`; `app`: `string`;} \>; `source`: `ZodObject`\< \{`api`: `ZodString`; `app`:
> `ZodString`;}, `"strip"`, `ZodTypeAny`, \{`api`: `string`; `app`: `string`;}, \{`api`: `string`; `app`: `string`;} \>;
> `type`: `ZodEnum`\< [`"operation"`] \>;}, `"strip"`, `ZodTypeAny`, \{`path`: `{ app: string; api: string; }`;
> `source`: `{ app: string; api: string; }`; `type`: `"operation"`;}, \{`path`: `{ app: string; api: string; }`;
> `source`: `{ app: string; api: string; }`; `type`: `"operation"`;} \>, `ZodObject`\< \{`entries`: `ZodArray`\<
> `ZodUnion`\< [`ZodObject`\< \{`name`: `ZodString`; `source`: `ZodString`; `type`: `ZodUnion`\< [`ZodEnum`\<
> [`"interface"`, `"display"`, `"layout"`, `"module"`, `"panel"`] \>, `ZodEnum`\< [`"hook"`, `"endpoint"`] \>] \>;},
> `"strip"`, `ZodTypeAny`, \{`name`: `string`; `source`: `string`; `type`: `"interface"` \| `"display"` \| `"layout"` \|
> `"module"` \| `"panel"` \| `"hook"` \| `"endpoint"`;}, \{`name`: `string`; `source`: `string`; `type`: `"interface"`
> \| `"display"` \| `"layout"` \| `"module"` \| `"panel"` \| `"hook"` \| `"endpoint"`;} \>, `ZodObject`\< \{`name`:
> `ZodString`; `source`: `ZodObject`\< \{`api`: `ZodString`; `app`: `ZodString`;}, `"strip"`, `ZodTypeAny`, \{`api`:
> `string`; `app`: `string`;}, \{`api`: `string`; `app`: `string`;} \>; `type`: `ZodEnum`\< [`"operation"`] \>;},
> `"strip"`, `ZodTypeAny`, \{`name`: `string`; `source`: `{ app: string; api: string; }`; `type`: `"operation"`;},
> \{`name`: `string`; `source`: `{ app: string; api: string; }`; `type`: `"operation"`;} \>] \>, `"many"` \>; `path`:
> `ZodObject`\< \{`api`: `ZodString`; `app`: `ZodString`;}, `"strip"`, `ZodTypeAny`, \{`api`: `string`; `app`:
> `string`;}, \{`api`: `string`; `app`: `string`;} \>; `type`: `ZodLiteral`\< `"bundle"` \>;}, `"strip"`, `ZodTypeAny`,
> \{`entries`:
> (`{ type: "interface" | "display" | "layout" | "module" | "panel" | "hook" | "endpoint"; name: string; source: string; }`
> \| `{ type: "operation"; name: string; source: { app: string; api: string; }; }`)[]; `path`:
> `{ app: string; api: string; }`; `type`: `"bundle"`;}, \{`entries`:
> (`{ type: "interface" | "display" | "layout" | "module" | "panel" | "hook" | "endpoint"; name: string; source: string; }`
> \| `{ type: "operation"; name: string; source: { app: string; api: string; }; }`)[]; `path`:
> `{ app: string; api: string; }`; `type`: `"bundle"`;} \>] \> \>; `name`: `ZodString`; `type`: `ZodOptional`\<
> `ZodUnion`\< [`ZodLiteral`\< `"module"` \>, `ZodLiteral`\< `"commonjs"` \>] \> \>; `version`: `ZodString`;},
> `"strip"`, `ZodTypeAny`, \{`dependencies`: `Record`\< `string`, `string` \>; `directus:extension`: `Object` &
> `undefined` \| `Object`; `name`: `string`; `type`: `"module"` \| `"commonjs"`; `version`: `string`;},
> \{`dependencies`: `Record`\< `string`, `string` \>; `directus:extension`: `Object` & `undefined` \| `Object`; `name`:
> `string`; `type`: `"module"` \| `"commonjs"`; `version`: `string`;} \>

## Source

[packages/constants/src/extensions.ts:80](https://github.com/directus/directus/blob/7789a6c53/packages/constants/src/extensions.ts#L80)
