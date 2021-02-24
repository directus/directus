# Tab Item

Individual tab content. To be used in a `v-tabs-items` context.

```html
<v-tabs-items>
	<v-tab-item>This is the content for the first tab.</v-tab-item>
	<v-tab-item>This is the content for the second tab.</v-tab-item>
</v-tabs-items>
```

If you're using a custom value in the `value` prop, make sure the corresponding tab uses the same value to match:

```html
<v-tabs v-model="selection">
	<v-tab value="home">Home</v-tab>
	<v-tab>Settings</v-tab>
</v-tabs>

<v-tabs-items v-model="selection">
	<v-tab-item value="home">This is the content for home.</v-tab-item>
	<v-tab-item>Settings content</v-tab-item>
</v-tabs-items>
```

## Reference

#### Props

| Prop    | Description                             | Default | Type     |
| ------- | --------------------------------------- | ------- | -------- |
| `value` | Custom value to use for selection state | `null`  | `String` |

#### Events

n/a

#### Slots

| Slot      | Description      | Data                                      |
| --------- | ---------------- | ----------------------------------------- |
| _default_ | Tab item content | `{ active: boolean, toggle: () => void }` |
