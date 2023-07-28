---
editLink: false
---

# Interface: WebSocketClient`<Schema>`

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Methods

### connect()

> **connect**(): `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

#### Source

[realtime/types.ts:30](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L30)

---

### disconnect()

> **disconnect**(): `void`

#### Returns

`void`

#### Source

[realtime/types.ts:31](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L31)

---

### onWebSocket()

> **onWebSocket**(`event`, `callback`): [`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Parameters

| Parameter  | Type                    |
| :--------- | :---------------------- |
| `event`    | `"open"`                |
| `callback` | (`this`, `ev`) => `any` |

#### Returns

[`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Source

[realtime/types.ts:32](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L32)

> **onWebSocket**(`event`, `callback`): [`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Parameters

| Parameter  | Type                    |
| :--------- | :---------------------- |
| `event`    | `"error"`               |
| `callback` | (`this`, `ev`) => `any` |

#### Returns

[`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Source

[realtime/types.ts:33](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L33)

> **onWebSocket**(`event`, `callback`): [`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Parameters

| Parameter  | Type                    |
| :--------- | :---------------------- |
| `event`    | `"close"`               |
| `callback` | (`this`, `ev`) => `any` |

#### Returns

[`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Source

[realtime/types.ts:34](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L34)

> **onWebSocket**(`event`, `callback`): [`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Parameters

| Parameter  | Type                    |
| :--------- | :---------------------- |
| `event`    | `"message"`             |
| `callback` | (`this`, `ev`) => `any` |

#### Returns

[`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Source

[realtime/types.ts:35](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L35)

> **onWebSocket**(`event`, `callback`): [`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Parameters

| Parameter  | Type                                                                           |
| :--------- | :----------------------------------------------------------------------------- |
| `event`    | [`WebSocketEvents`](../type-aliases/type-alias.WebSocketEvents.md)             |
| `callback` | [`WebSocketEventHandler`](../type-aliases/type-alias.WebSocketEventHandler.md) |

#### Returns

[`RemoveEventHandler`](../type-aliases/type-alias.RemoveEventHandler.md)

#### Source

[realtime/types.ts:36](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L36)

---

### sendMessage()

> **sendMessage**(`message`): `void`

#### Parameters

| Parameter | Type                                      |
| :-------- | :---------------------------------------- |
| `message` | `string` \| `Record`\< `string`, `any` \> |

#### Returns

`void`

#### Source

[realtime/types.ts:37](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L37)

---

### subscribe()

> **subscribe**\<`Collection`, `Options`\>(`collection`, `options`?): `Promise`\< \{`subscription`: `AsyncGenerator`\<
> [`SubscriptionOutput`](../type-aliases/type-alias.SubscriptionOutput.md)\< `Schema`, `Collection`,
> `Options`[`"query"`], `Fallback`\< `Options`[`"event"`],
> [`SubscriptionOptionsEvents`](../type-aliases/type-alias.SubscriptionOptionsEvents.md) \> \| `"init"`,
> `Options`[`"query"`] _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`,
> `Schema`[`Collection`] \> ? [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`,
> `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
> [`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
> `object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
> `never` \> \>, [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
> `object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
> `never` \> \>, `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \>,
> [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \> \> _extends_ `never` ?
> `never` : _keyof_ [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \> \> \> \> \>,
> [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \> \> _extends_ `never` ?
> `never` : \{ [Field in string \| number \| symbol]: Field extends keyof UnpackList\<IfAny\<Schema, any, Collection
> extends keyof Schema ? UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> :
> never : never\>\> ? Extract\<UnpackList\<IfAny\<Schema, any, Collection extends keyof Schema ?
> UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> : never :
> never\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<IfAny\<Schema, any,
> Collection extends keyof Schema ? UnpackList\<Schema[Collection]\> extends object ? object &
> UnpackList\<Schema[Collection]\> : never : never\>\>[Field], null \| (RelatedCollection extends any[] ?
> HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
> HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>\> : never : never } \> \> : `Partial`\<
> `Schema`[`Collection`] \> \>, `void`, `unknown` \>; `unsubscribe`: ;} \>

#### Type parameters

| Parameter                                                                                           |
| :-------------------------------------------------------------------------------------------------- |
| `Collection` _extends_ `string` \| `number` \| `symbol`                                             |
| `Options` _extends_ [`SubscribeOptions`](interface.SubscribeOptions.md)\< `Schema`, `Collection` \> |

#### Parameters

| Parameter    | Type         |
| :----------- | :----------- |
| `collection` | `Collection` |
| `options`?   | `Options`    |

#### Returns

`Promise`\< \{`subscription`: `AsyncGenerator`\<
[`SubscriptionOutput`](../type-aliases/type-alias.SubscriptionOutput.md)\< `Schema`, `Collection`, `Options`[`"query"`],
`Fallback`\< `Options`[`"event"`],
[`SubscriptionOptionsEvents`](../type-aliases/type-alias.SubscriptionOptionsEvents.md) \> \| `"init"`,
`Options`[`"query"`] _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`]
\> ? [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
[`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
[`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
`object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
`never` \> \>, [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
`object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
`never` \> \>, `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \>,
[`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \> \> _extends_ `never` ?
`never` : _keyof_ [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \> \> \> \> \>,
[`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `any`[`any`][`"fields"`] \> \> \> _extends_ `never` ?
`never` : \{ [Field in string \| number \| symbol]: Field extends keyof UnpackList\<IfAny\<Schema, any, Collection
extends keyof Schema ? UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> :
never : never\>\> ? Extract\<UnpackList\<IfAny\<Schema, any, Collection extends keyof Schema ?
UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> : never : never\>\>[Field],
ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<IfAny\<Schema, any, Collection extends keyof
Schema ? UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> : never :
never\>\>[Field], null \| (RelatedCollection extends any[] ? HasManyToAnyRelation\<RelatedCollection\> extends never ?
null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field],
UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field],
UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<any[any]["fields"]\>\>\>[Field]\>\> : never : never } \> \> : `Partial`\<
`Schema`[`Collection`] \> \>, `void`, `unknown` \>; `unsubscribe`: ;} \>

#### Source

[realtime/types.ts:38](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L38)
