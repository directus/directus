---
editLink: false
---

# Type alias: AggregationOutput`<Schema, Collection, Options>`

> **AggregationOutput**: \<`Schema`, `Collection`, `Options`\> `Options`[`"groupBy"`] _extends_ `string`[] ?
> [`UnpackList`](type-alias.UnpackList.md)\< [`GetCollection`](type-alias.GetCollection.md)\< `Schema`, `Collection` \>
> \> _extends_ infer Item ? `MappedFunctionFields`\< `Schema`, `Item` \> _extends_ infer FieldMap ? `MappedFieldNames`\<
> `Schema`, `Item` \> _extends_ infer NamesMap ?
> `{ [Field in UnpackList<Options["groupBy"]> as TranslateFunctionField<FieldMap, Field>]: ExtractFieldName<NamesMap, Field> extends keyof Item ? Item[ExtractFieldName<NamesMap, Field>] : never }`
> : `never` : `never` : `never` : `object` &
> `{ [Func in keyof Options["aggregate"]]: Func extends keyof AggregationTypes ? Options["aggregate"][Func] extends string ? Options["aggregate"][Func] extends "*" ? AggregationTypes[Func]["output"] : { [Field in Options["aggregate"][Func]]: AggregationTypes[Func]["output"] } : never : never }`[]

Output typing for aggregation

## Type parameters

| Parameter                                                                                                |
| :------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                              |
| `Collection` _extends_ [`AllCollections`](type-alias.AllCollections.md)\< `Schema` \>                    |
| `Options` _extends_ [`AggregationOptions`](type-alias.AggregationOptions.md)\< `Schema`, `Collection` \> |

## Source

[types/aggregate.ts:75](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/aggregate.ts#L75)
