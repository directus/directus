# Tab

Individual tab. To be used inside a `v-tabs` context.

```html
<v-tabs>
	<v-tab>Schema</v-tab>
	<v-tab>Options</v-tab>
</v-tabs>
```

## Reference

#### Props

| Prop       | Description                                            | Default | Type      |
| ---------- | ------------------------------------------------------ | ------- | --------- |
| `disabled` | Disable the tab                                        | `false` | `Boolean` |
| `value`    | A custom value to be used in the selection of `v-tabs` | `null`  | `String`  |

#### Events

n/a

#### Slots

| Slot      | Description | Data                                       |
| --------- | ----------- | ------------------------------------------ |
| _default_ |             | `{ active: boolean, toggle: () => void; }` |

#### CSS Variables

| Variable                          | Default                     |
| --------------------------------- | --------------------------- |
| `--v-tab-color`                   | `var(--foreground-subdued)` |
| `--v-tab-background-color`        | `var(--background-page)`    |
| `--v-tab-color-active`            | `var(--foreground-normal)`  |
| `--v-tab-background-color-active` | `var(--background-page)`    |
