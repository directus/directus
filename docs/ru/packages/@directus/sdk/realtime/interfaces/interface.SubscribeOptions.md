---
editLink: false
---

# Interface: SubscribeOptions`<Schema, Collection>`

## Type parameters

| Parameter                               |
| :-------------------------------------- |
| `Schema` _extends_ `object`             |
| `Collection` _extends_ _keyof_ `Schema` |

## Properties

### event

> `optional` **event**: [`SubscriptionOptionsEvents`](../type-aliases/type-alias.SubscriptionOptionsEvents.md)

#### Source

[realtime/types.ts:20](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L20)

---

### query

> `optional` **query**: [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \>

#### Source

[realtime/types.ts:21](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L21)

---

### uid

> `optional` **uid**: `string`

#### Source

[realtime/types.ts:22](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L22)
