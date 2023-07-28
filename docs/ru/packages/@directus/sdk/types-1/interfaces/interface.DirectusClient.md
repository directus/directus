---
editLink: false
---

# Interface: DirectusClient`<Schema>`

empty directus client

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Properties

### url

> **url**: `URL`

#### Source

[types/client.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/client.ts#L5)

---

### with

> **with**: \<Extension\>(`createExtension`) => [`DirectusClient`](interface.DirectusClient.md)\< `Schema` \> &
> `Extension`

#### Type parameters

| Parameter                      |
| :----------------------------- |
| `Extension` _extends_ `object` |

#### Parameters

| Parameter         | Type                      |
| :---------------- | :------------------------ |
| `createExtension` | (`client`) => `Extension` |

#### Returns

[`DirectusClient`](interface.DirectusClient.md)\< `Schema` \> & `Extension`

#### Source

[types/client.ts:6](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/client.ts#L6)
