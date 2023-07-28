---
editLink: false
---

# Interface: Query`<Schema, Item>`

All query options available

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Properties

### alias

> `optional` `readonly` **alias**: [`IfAny`](../type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`,
> `string` \>, [`QueryAlias`](../type-aliases/type-alias.QueryAlias.md)\< `Schema`, `Item` \> \>

#### Source

[types/query.ts:17](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L17)

---

### deep

> `optional` `readonly` **deep**: [`IfAny`](../type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any`
> \>, [`QueryDeep`](../type-aliases/type-alias.QueryDeep.md)\< `Schema`, `Item` \> \>

#### Source

[types/query.ts:16](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L16)

---

### fields

> `optional` `readonly` **fields**: [`IfAny`](../type-aliases/type-alias.IfAny.md)\< `Schema`, (`string` \| `Record`\<
> `string`, `any` \>)[], [`QueryFields`](../type-aliases/type-alias.QueryFields.md)\< `Schema`, `Item` \> \>

#### Source

[types/query.ts:9](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L9)

---

### filter

> `optional` `readonly` **filter**: [`IfAny`](../type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`,
> `any` \>, [`QueryFilter`](../type-aliases/type-alias.QueryFilter.md)\< `Schema`, `Item` \> \>

#### Source

[types/query.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L10)

---

### limit

> `optional` `readonly` **limit**: `number`

#### Source

[types/query.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L13)

---

### offset

> `optional` `readonly` **offset**: `number`

#### Source

[types/query.ts:14](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L14)

---

### page

> `optional` `readonly` **page**: `number`

#### Source

[types/query.ts:15](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L15)

---

### search

> `optional` `readonly` **search**: `string`

#### Source

[types/query.ts:11](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L11)

---

### sort

> `optional` `readonly` **sort**: [`IfAny`](../type-aliases/type-alias.IfAny.md)\< `Schema`, `string` \| `string`[],
> [`QuerySort`](../type-aliases/type-alias.QuerySort.md)\< `Schema`, `Item` \> \|
> [`QuerySort`](../type-aliases/type-alias.QuerySort.md)\< `Schema`, `Item` \>[] \>

#### Source

[types/query.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L12)
