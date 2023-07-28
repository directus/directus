---
editLink: false
---

# Type alias: UsableItems

> **UsableItems**: `object`

## Type declaration

### changeManualSort

**changeManualSort**: (`data`) => `Promise`\< `void` \>

#### Parameters

| Parameter | Type                                             |
| :-------- | :----------------------------------------------- |
| `data`    | [`ManualSortData`](type-alias.ManualSortData.md) |

#### Returns

`Promise`\< `void` \>

---

### error

**error**: `Ref`\< `any` \>

---

### getItemCount

**getItemCount**: () => `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

---

### getItems

**getItems**: () => `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

---

### getTotalCount

**getTotalCount**: () => `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

---

### itemCount

**itemCount**: `Ref`\< `number` \| `null` \>

---

### items

**items**: `Ref`\< `Item`[] \>

---

### loading

**loading**: `Ref`\< `boolean` \>

---

### totalCount

**totalCount**: `Ref`\< `number` \| `null` \>

---

### totalPages

**totalPages**: `ComputedRef`\< `number` \>

## Source

[use-items.ts:15](https://github.com/directus/directus/blob/7789a6c53/packages/composables/src/use-items.ts#L15)
