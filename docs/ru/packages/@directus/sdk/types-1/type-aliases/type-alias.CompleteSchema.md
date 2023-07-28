---
editLink: false
---

# Type alias: CompleteSchema`<Schema>`

> **CompleteSchema**: \<`Schema`\> [`CoreSchema`](../../schema/interfaces/interface.CoreSchema.md)\< `Schema` \>
> _extends_ infer Core ? \{ [Collection in keyof Schema \| keyof Core]: Collection extends keyof Core ? Core[Collection]
> : Collection extends keyof Schema ? Schema[Collection] : never } : `never`

Merge custom and core schema objects

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[types/schema.ts:81](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L81)
