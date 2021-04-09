# Table

Used to display data like a list of objects in a table like view.

```html
<v-table
	:headers="[
		{
			text: 'Name',
			value: 'name'
		},
		{
			text: 'Phone Number',
			value: 'tel'
		},
		{
			text: 'Contact',
			value: 'person'
		}
	]"
	:items="[
		{
			name: 'Amsterdam',
			tel: '020-1122334',
			person: 'Mariann Rumble'
		},
		{
			name: 'New Haven',
			tel: '(203) 687-9900',
			person: 'Helenka Killely'
		}
	]"
/>
```

## Headers

| Property   | Description                                                  | Default |
| ---------- | ------------------------------------------------------------ | ------- |
| `text`\*   | Text displayed in the column                                 | --      |
| `value`\*  | Name of the object property that holds the value of the item | --      |
| `align`    | Text alignment of value. One of `left`, `center`, `right`    | `left`  |
| `sortable` | If the column can be sorted on                               | `true`  |
| `width`    | Custom width of the column in px                             | --      |

## Custom element / component for header

You can override the displayed header name by using the dynamic `header.[name]` slot. `[name]` is the `value` property
in the header item for this column sent to `headers`.

```html
<v-table :headers="headers" :items="items">
	<template #header.name="{ header }">
		<v-button>{{ header.text }}</v-button>
	</template>
</v-table>
```

In this slot, you have access to the `header` through the scoped slot binding.

## Custom element / component for cell value

You can override the columns in a row by using the dynamic `item.[name]` slot. `[name]` is the `value` property in the
header item for this column sent to `headers`.

```html
<v-table :headers="headers" :items="items">
	<template #item.name="{ item }">
		<v-button>{{ item.name }}</v-button>
	</template>
</v-table>
```

In this slot, you have access to the `item` through the scoped slot binding.

## Resizable rows

Adding the `show-resize` prop allows the user to resize the columns at will. You can keep your headers updated by using
the `.sync` modifier or listening to the `update:headers` event:

```html
<template>
	<v-table :headers.sync="headers" :items="[]" show-resize>
</template>

<script>
import { defineComponent, ref } from '@vue/composition-api';
import { HeaderRaw } from '@/components/v-table/types';

export default defineComponent({
	setup() {
		const headers = ref<HeaderRaw[]>([
			{
				text: 'Column 1',
				value: 'col1',
				width: 150
			},
			{
				text: 'Column 1',
				value: 'col1',
				width: 300
			}
		]);

		return { headers };
	}
});
</script>
```

## Reference

#### Props

| Prop                 | Description                                                                                    | Default              | Type          |
| -------------------- | ---------------------------------------------------------------------------------------------- | -------------------- | ------------- |
| `headers`\*          | What columns to show in the table. Supports the `.sync` modifier                               |                      | `HeaderRaw[]` |
| `items`\*            | The individual items to render as rows                                                         |                      | `Item[]`      |
| `disabled`           | Disable edits to items in the form (drag/select)                                               | `false`              | `Boolean`     |
| `fixed-header`       | Make the header fixed                                                                          | `false`              | `Boolean`     |
| `inline`             | Display the table inline with other text                                                       | `false`              | `Boolean`     |
| `item-key`           | Primary key of the item. Used for keys / selections                                            | `'id'`               | `String`      |
| `loading-text`       | What text to show when table is loading with no items                                          | `i18n.t('loading')`  | `String`      |
| `loading`            | Show progress indicator                                                                        | `false`              | `Boolean`     |
| `manual-sort-key`    | What field to use for manual sorting                                                           | `null`               | `String`      |
| `must-sort`          | Requires the sort to be on a particular column                                                 | `false`              | `Boolean`     |
| `no-items-text`      | What text to show when table doesn't contain any rows                                          | `i18n.t('no_items')` | `String`      |
| `row-height`         | Height of the individual rows in px                                                            | `48`                 | `Number`      |
| `selection-use-keys` | What field to use for selection                                                                | `false`              | `Boolean`     |
| `selection`          | What items are selected. Can be used with `v-model` as well                                    | `() => []`           | `any`         |
| `server-sort`        | Handle sorting on the parent level.                                                            | `false`              | `Boolean`     |
| `show-manual-sort`   | Show manual sort drag handles                                                                  | `false`              | `Boolean`     |
| `show-resize`        | Show resize handlers                                                                           | `false`              | `Boolean`     |
| `show-select`        | Show checkboxes                                                                                | `false`              | `Boolean`     |
| `sort`               | What column / order to sort by. Supports the `.sync` modifier. `{ by: string, desc: boolean }` | `null`               | `Sort`        |

#### Events

| Event            | Description                                       | Value                           |
| ---------------- | ------------------------------------------------- | ------------------------------- |
| `update:sort`    | `.sync` event for `sort` prop                     | `{ by: string, desc: boolean }` |
| `click:row`      | When a row has been clicked                       |                                 |
| `update:items`   | When changes to the items where made              |                                 |
| `manual-sort`    | When a user manually sorts the items              |                                 |
| `update:headers` | `.sync` event for `headers` prop or `HeaderRaw[]` |                                 |
| `item-selected`  | Emitted when an item is selected or deselected    | `{ item: any, value: boolean }` |
| `select`         | Emitted when selected items change                | `any[]`                         |

#### Slots

| Slot                     | Description                  | Data |
| ------------------------ | ---------------------------- | ---- |
| `header.${header.value}` | A slot for each header       |      |
| `item.${header.value}`   | A slot for each item         |      |
| `item-append`            | Adds to the end of each item |      |
| `footer`                 | Could be used for pagination |      |

#### CSS Variables

| Variable                      | Default                    |
| ----------------------------- | -------------------------- |
| `--v-table-height`            | `auto`                     |
| `--v-table-sticky-offset-top` | `0`                        |
| `--v-table-color`             | `var(--foreground-normal)` |
| `--v-table-background-color`  | `var(--background-page)`   |
