# List Item Icon

Adds an icon to a `v-list-item`.

```html
<v-list-item>
	<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
	This is a person
</v-list-item>
```

## Reference

#### Props

| Prop     | Description      | Default | Type      |
| -------- | ---------------- | ------- | --------- |
| `center` | Centers the icon | `false` | `Boolean` |

#### CSS Variables

| Variable                   | Default                     |
| -------------------------- | --------------------------- |
| `--v-list-item-icon-color` | `var(--foreground-subdued)` |

#### Slots

| Slot      | Description         | Data |
| --------- | ------------------- | ---- |
| _default_ | Where the icon goes |      |
