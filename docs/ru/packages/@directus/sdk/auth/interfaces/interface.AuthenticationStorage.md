---
editLink: false
---

# Interface: AuthenticationStorage

## Properties

### get

> **get**: () => `null` \| [`AuthenticationData`](interface.AuthenticationData.md) \| `Promise`\< `null` \|
> [`AuthenticationData`](interface.AuthenticationData.md) \>

#### Returns

`null` \| [`AuthenticationData`](interface.AuthenticationData.md) \| `Promise`\< `null` \|
[`AuthenticationData`](interface.AuthenticationData.md) \>

#### Source

[auth/types.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L13)

---

### set

> **set**: (`value`) => `void` \| `Promise`\< `void` \>

#### Parameters

| Parameter | Type                                                              |
| :-------- | :---------------------------------------------------------------- |
| `value`   | `null` \| [`AuthenticationData`](interface.AuthenticationData.md) |

#### Returns

`void` \| `Promise`\< `void` \>

#### Source

[auth/types.ts:14](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L14)
