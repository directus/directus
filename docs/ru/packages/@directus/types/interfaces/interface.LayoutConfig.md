---
editLink: false
---

# Interface: LayoutConfig`<Options, Query>`

## Type parameters

| Parameter | Default |
| :-------- | :------ |
| `Options` | `any`   |
| `Query`   | `any`   |

## Properties

### component

> **component**: `Component`

#### Source

[types/src/layouts.ts:9](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L9)

---

### headerShadow

> `optional` **headerShadow**: `boolean`

#### Source

[types/src/layouts.ts:16](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L16)

---

### icon

> **icon**: `string`

#### Source

[types/src/layouts.ts:7](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L7)

---

### id

> **id**: `string`

#### Source

[types/src/layouts.ts:5](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L5)

---

### name

> **name**: `string`

#### Source

[types/src/layouts.ts:6](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L6)

---

### setup

> **setup**: (`props`, `ctx`) => `Record`\< `string`, `unknown` \>

#### Parameters

| Parameter | Type                                                              |
| :-------- | :---------------------------------------------------------------- |
| `props`   | [`LayoutProps`](interface.LayoutProps.md)\< `Options`, `Query` \> |
| `ctx`     | `LayoutContext`                                                   |

#### Returns

`Record`\< `string`, `unknown` \>

#### Source

[types/src/layouts.ts:18](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L18)

---

### sidebarShadow

> `optional` **sidebarShadow**: `boolean`

#### Source

[types/src/layouts.ts:17](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L17)

---

### slots

> **slots**: `object`

#### Type declaration

> ##### slots.actions
>
> **actions**: `Component`
>
> ##### slots.options
>
> **options**: `Component`
>
> ##### slots.sidebar
>
> **sidebar**: `Component`

#### Source

[types/src/layouts.ts:10](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L10)

---

### smallHeader

> `optional` **smallHeader**: `boolean`

#### Source

[types/src/layouts.ts:15](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/layouts.ts#L15)
