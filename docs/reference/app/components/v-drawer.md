# Drawer

A more robust dialog that is rendered at the side and provides more space than a usual dialog. Can be helpful for
relational or nested data.

```html
<v-drawer v-model="isOpen">
	<div>This text will show up in the drawer</div>
</v-drawer>
```

## Reference

#### Props

| Prop            | Description                                            | Default             | Type      |
| --------------- | ------------------------------------------------------ | ------------------- | --------- |
| `title`\*       | The title of the drawer                                |                     | `String`  |
| `subtitle`      | The subtitle of the drawer                             | `null`              | `String`  |
| `active`        | Can be used with `v-model` to open or close the drawer | `undefined`         | `Boolean` |
| `persistent`    | Disallow closing the drawer by clicking out of it      | `false`             | `Boolean` |
| `icon`          | An icon for the drawer                                 | `'box'`             | `String`  |
| `sidebar-label` | A label for the sidebar                                | `i18n.t('sidebar')` | `String`  |

#### Events

| Event    | Description                                                      | Value     |
| -------- | ---------------------------------------------------------------- | --------- |
| `cancel` | When escape is pressed or the drawer gets canceled in other ways |           |
| `toggle` | When the drawer gets opened or closed                            | `boolean` |

#### Slots

| Slot              | Description                                            | Data |
| ----------------- | ------------------------------------------------------ | ---- |
| `activator`       | Elements placed inside here can activate the drawer    | `on` |
| `sidebar`         | Display components to the side of the drawer like tabs |      |
| `subtitle`        | Add a custom subtitle                                  |      |
| `actions:prepend` | Prepend actions to the drawer                          |      |
| `actions`         | Add actions to the top right corner                    |      |
| `header:append`   | Append your elements to the header                     |      |
| _default_         | Where the content of the drawer goes                   |      |

#### CSS Variables

| Variable               | Default |
| ---------------------- | ------- |
| `--v-drawer-max-width` | `856px` |
