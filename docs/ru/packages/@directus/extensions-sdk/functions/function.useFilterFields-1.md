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

composables/dist/use-filter-fields.d.ts:3
