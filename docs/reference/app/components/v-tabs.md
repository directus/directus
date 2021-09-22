# Tabs

Tabs work like tabs in the browser and are there to split data into quickly accessible pages.

```html
<v-tabs v-model="activePage">
	<v-tab>Tab 1</v-tab>
	<v-tab>Tab 2</v-tab>
	<v-tab>Tab 3</v-tab>
</v-tabs>
```

## With Tab Items

To be able to display a page depending on the tab use tab items.

```html
<v-tabs v-model="activePage">
	<v-tab>Tab 1</v-tab>
	<v-tab>Tab 2</v-tab>
	<v-tab>Tab 3</v-tab>
</v-tabs>

<v-tabs-items v-model="activePage">
	<v-tab-item>
		<h1>This is the first page</h1>
	</v-tab-item>
	<v-tab-item>
		<h1>This is the second page</h1>
	</v-tab-item>
	<v-tab-item>
		<h1>This is the third page</h1>
	</v-tab-item>
</v-tabs-items>
```

## Reference

#### Props

| Prop       | Description                           | Default     | Type                   |
| ---------- | ------------------------------------- | ----------- | ---------------------- |
| `value`    | The currently selected tab            | `undefined` | `(string or number)[]` |
| `vertical` | Display the tabs in a vertical format | `false`     | `Boolean`              |

#### CSS Variables

| Variable                   | Default                    |
| -------------------------- | -------------------------- |
| `--v-tabs-underline-color` | `var(--foreground-normal)` |

#### Events

| Event   | Description                     | Value |
| ------- | ------------------------------- | ----- |
| `input` | Used to update the selected tab |       |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
