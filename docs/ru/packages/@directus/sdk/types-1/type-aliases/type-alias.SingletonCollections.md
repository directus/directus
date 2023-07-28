---
editLink: false
---

# Type alias: SingletonCollections`<Schema>`

> **SingletonCollections**: \<`Schema`\> `{ [Key in keyof Schema]: Schema[Key] extends any[] ? never : Key }`[*keyof*
> `Schema`]

Returns a list of singleton collections in the schema

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[types/schema.ts:29](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L29)
