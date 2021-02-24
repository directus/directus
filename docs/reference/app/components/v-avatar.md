# Avatar

The avatar component can be used to display a person or something similar. It will generate a grey box in which either a
profile picture or an icon or text can be inserted.

```html
<v-avatar>RVZ</v-avatar>

<v-avatar>
	<img src="..." />
</v-avatar>

<v-avatar>
	<v-icon name="person" />
</v-avatar>
```

## Reference

#### Props

| Prop   | Description               | Default | Type      |
| ------ | ------------------------- | ------- | --------- |
| `size` | Size in px                | `null`  | `Number`  |
| `tile` | Render as a tile (square) | `false` | `Boolean` |

#### Slots

| Slot      | Description                                             | Data |
| --------- | ------------------------------------------------------- | ---- |
| _default_ | Default slot to display your elements inside the avatar | --   |

#### Events

n/a

#### CSS Variables

| Variable           | Default                    |
| ------------------ | -------------------------- |
| `--v-avatar-color` | `var(--background-normal)` |
| `--v-avatar-size`  | `48px`                     |
