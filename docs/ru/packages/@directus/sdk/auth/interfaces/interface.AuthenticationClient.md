---
editLink: false
---

# Interface: AuthenticationClient`<_Schema>`

## Type parameters

| Parameter                    |
| :--------------------------- |
| `_Schema` _extends_ `object` |

## Methods

### getToken()

> **getToken**(): `Promise`\< `null` \| `string` \>

#### Returns

`Promise`\< `null` \| `string` \>

#### Source

[auth/types.ts:28](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L28)

---

### login()

> **login**( `email`, `password`, `options`): `Promise`\< [`AuthenticationData`](interface.AuthenticationData.md) \>

#### Parameters

| Parameter  | Type                                                              |
| :--------- | :---------------------------------------------------------------- |
| `email`    | `string`                                                          |
| `password` | `string`                                                          |
| `options`  | [`loginOptions`](../../rest/interfaces/interface.loginOptions.md) |

#### Returns

`Promise`\< [`AuthenticationData`](interface.AuthenticationData.md) \>

#### Source

[auth/types.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L24)

---

### logout()

> **logout**(): `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

#### Source

[auth/types.ts:26](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L26)

---

### refresh()

> **refresh**(): `Promise`\< [`AuthenticationData`](interface.AuthenticationData.md) \>

#### Returns

`Promise`\< [`AuthenticationData`](interface.AuthenticationData.md) \>

#### Source

[auth/types.ts:25](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L25)

---

### setToken()

> **setToken**(`access_token`): `void`

#### Parameters

| Parameter      | Type               |
| :------------- | :----------------- |
| `access_token` | `null` \| `string` |

#### Returns

`void`

#### Source

[auth/types.ts:29](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/types.ts#L29)
