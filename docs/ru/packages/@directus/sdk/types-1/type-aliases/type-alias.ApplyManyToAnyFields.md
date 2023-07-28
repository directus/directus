---
editLink: false
---

# Type alias: ApplyManyToAnyFields`<Schema, JunctionCollection, FieldsList, Junction>`

> **ApplyManyToAnyFields**: \<`Schema`, `JunctionCollection`, `FieldsList`, `Junction`\> `Junction` _extends_ `object` ?
> [`PickRelationalFields`](type-alias.PickRelationalFields.md)\< `FieldsList` \> _extends_ `never` ?
> [`ApplyQueryFields`](type-alias.ApplyQueryFields.md)\< `Schema`, `Junction`, `Readonly`\<
> [`UnpackList`](type-alias.UnpackList.md)\< `FieldsList` \> \> \> : `"item"` _extends_ _keyof_
> [`PickRelationalFields`](type-alias.PickRelationalFields.md)\< `FieldsList` \> ?
> [`PickRelationalFields`](type-alias.PickRelationalFields.md)\< `FieldsList` \>[`"item"`] _extends_ infer ItemFields ?
> `Omit`\< [`ApplyQueryFields`](type-alias.ApplyQueryFields.md)\< `Schema`, `Omit`\< `Junction`, `"item"` \>,
> `Readonly`\< [`UnpackList`](type-alias.UnpackList.md)\< `FieldsList` \> \> \>, `"item"` \> & \{`item`:
> `{ [Scope in keyof ItemFields]: Scope extends keyof Schema ? ApplyNestedQueryFields<Schema, Schema[Scope], ItemFields[Scope]> : never }`[*keyof*
> `ItemFields`];} : `never` : [`ApplyQueryFields`](type-alias.ApplyQueryFields.md)\< `Schema`, `Junction`, `Readonly`\<
> [`UnpackList`](type-alias.UnpackList.md)\< `FieldsList` \> \> \> : `never`

Apply the configured fields query parameter on a many to any relation

## Type parameters

| Parameter                   | Default                                                            |
| :-------------------------- | :----------------------------------------------------------------- |
| `Schema` _extends_ `object` | -                                                                  |
| `JunctionCollection`        | -                                                                  |
| `FieldsList`                | -                                                                  |
| `Junction`                  | [`UnpackList`](type-alias.UnpackList.md)\< `JunctionCollection` \> |

## Source

[types/output.ts:46](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/output.ts#L46)
