---
editLink: false
---

# Function: useFilterFields()

> **useFilterFields**\<`T`\>(`fields`, `filters`): `object`

## Type parameters

| Parameter              |
| :--------------------- |
| `T` _extends_ `string` |

## Parameters

| Parameter | Type                                      |
| :-------- | :---------------------------------------- |
| `fields`  | `Ref`\< `Field`[] \>                      |
| `filters` | `Record`\< `T`, (`field`) => `boolean` \> |

## Returns

### fieldGroups

**fieldGroups**: `ComputedRef`\< `Record`\< `Extract`\< `T`, `string` \>, `Field`[] \> \>

## Source

[use-filter-fields.ts:5](https://github.com/directus/directus/blob/7789a6c53/packages/composables/src/use-filter-fields.ts#L5)
