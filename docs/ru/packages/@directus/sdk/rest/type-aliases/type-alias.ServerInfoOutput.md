---
editLink: false
---

# Type alias: ServerInfoOutput

> **ServerInfoOutput**: `object`

## Type declaration

### flows

`optional` **flows**: `object`

#### Type declaration

> ##### flows.execAllowedModules
>
> **execAllowedModules**: `string`[]

---

### project

**project**: `object`

#### Type declaration

> ##### project.default_language
>
> **default_language**: `string`
>
> ##### project.project_name
>
> **project_name**: `string`

---

### queryLimit

`optional` **queryLimit**: `object`

#### Type declaration

> ##### queryLimit.default
>
> **default**: `number`
>
> ##### queryLimit.max
>
> **max**: `number`

---

### rateLimit

`optional` **rateLimit**: \{`duration`: `number`; `points`: `number`;} \| `false`

---

### rateLimitGlobal

`optional` **rateLimitGlobal**: \{`duration`: `number`; `points`: `number`;} \| `false`

---

### websocket

`optional` **websocket**: \{`graphql`: \{`authentication`:
[`WebSocketAuthModes`](../../realtime/type-aliases/type-alias.WebSocketAuthModes.md); `path`: `string`;} \| `false`;
`heartbeat`: `number` \| `false`; `rest`: \{`authentication`:
[`WebSocketAuthModes`](../../realtime/type-aliases/type-alias.WebSocketAuthModes.md); `path`: `string`;} \| `false`;} \|
`false`

## Source

[rest/commands/server/info.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/server/info.ts#L4)
