---
editLink: false
---

# Type alias: DeepPartial`<T>`

> **DeepPartial**: \<`T`\> `T` _extends_ `Builtin` ? `T` : `T` _extends_ [] ? [] : `T` _extends_ [infer U, `...(infer
> R)`] ? [[`DeepPartial`](type-alias.DeepPartial.md)\< `U` \>, `...DeepPartial<R>`] : `T` _extends_ infer U[] ?
> [`DeepPartial`](type-alias.DeepPartial.md)\< `U` \>[] : `T` _extends_ `ReadonlyArray`\< infer U \> ? `ReadonlyArray`\<
> [`DeepPartial`](type-alias.DeepPartial.md)\< `U` \> \> : `T` _extends_ `Map`\< infer K, infer V \> ? `Map`\<
> [`DeepPartial`](type-alias.DeepPartial.md)\< `K` \>, [`DeepPartial`](type-alias.DeepPartial.md)\< `V` \> \> : `T`
> _extends_ `ReadonlyMap`\< infer K, infer V \> ? `ReadonlyMap`\< [`DeepPartial`](type-alias.DeepPartial.md)\< `K` \>,
> [`DeepPartial`](type-alias.DeepPartial.md)\< `V` \> \> : `T` _extends_ `WeakMap`\< infer K, infer V \> ? `WeakMap`\<
> [`DeepPartial`](type-alias.DeepPartial.md)\< `K` \>, [`DeepPartial`](type-alias.DeepPartial.md)\< `V` \> \> : `T`
> _extends_ `Set`\< infer U \> ? `Set`\< [`DeepPartial`](type-alias.DeepPartial.md)\< `U` \> \> : `T` _extends_
> `ReadonlySet`\< infer U \> ? `ReadonlySet`\< [`DeepPartial`](type-alias.DeepPartial.md)\< `U` \> \> : `T` _extends_
> `WeakSet`\< infer U \> ? `WeakSet`\< [`DeepPartial`](type-alias.DeepPartial.md)\< `U` \> \> : `T` _extends_
> `Promise`\< infer U \> ? `Promise`\< [`DeepPartial`](type-alias.DeepPartial.md)\< `U` \> \> : `T` _extends_ `Record`\<
> `any`, `any` \> ? `{ [K in keyof T]?: DeepPartial<T[K]> }` : `Partial`\< `T` \>

## Type parameters

| Parameter |
| :-------- |
| `T`       |

## Source

[types/src/misc.ts:4](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/misc.ts#L4)
