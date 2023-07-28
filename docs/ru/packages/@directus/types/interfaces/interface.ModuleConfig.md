---
editLink: false
---

# Interface: ModuleConfig

## Properties

### color

> `optional` **color**: `string`

#### Source

[types/src/modules.ts:9](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L9)

---

### hidden

> `optional` **hidden**: `boolean`

#### Source

[types/src/modules.ts:12](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L12)

---

### icon

> **icon**: `string`

#### Source

[types/src/modules.ts:8](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L8)

---

### id

> **id**: `string`

#### Source

[types/src/modules.ts:6](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L6)

---

### name

> **name**: `string`

#### Source

[types/src/modules.ts:7](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L7)

---

### preRegisterCheck

> `optional` **preRegisterCheck**: (`user`, `permissions`) => `boolean` \| `Promise`\< `boolean` \>

#### Parameters

| Parameter     | Type                                                       |
| :------------ | :--------------------------------------------------------- |
| `user`        | [`User`](../type-aliases/type-alias.User.md)               |
| `permissions` | [`Permission`](../type-aliases/type-alias.Permission.md)[] |

#### Returns

`boolean` \| `Promise`\< `boolean` \>

#### Source

[types/src/modules.ts:13](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L13)

---

### routes

> **routes**: `RouteRecordRaw`[]

#### Source

[types/src/modules.ts:11](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/modules.ts#L11)
