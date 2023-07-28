---
editLink: false
---

# Interface: RequestOptions

## Properties

### body

> `optional` **body**: `string` \| `FormData`

#### Source

[types/request.ts:8](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L8)

---

### headers

> `optional` **headers**: `Record`\< `string`, `string` \>

#### Source

[types/request.ts:7](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L7)

---

### method

> `optional` **method**: [`HttpMethod`](../type-aliases/type-alias.HttpMethod.md)

#### Source

[types/request.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L5)

---

### onRequest

> `optional` **onRequest**: [`RequestTransformer`](interface.RequestTransformer.md)

#### Source

[types/request.ts:9](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L9)

---

### onResponse

> `optional` **onResponse**: `null` \| [`ResponseTransformer`](interface.ResponseTransformer.md)

#### Source

[types/request.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L10)

---

### params

> `optional` **params**: `Record`\< `string`, `any` \>

#### Source

[types/request.ts:6](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L6)

---

### path

> **path**: `string`

#### Source

[types/request.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/request.ts#L4)
