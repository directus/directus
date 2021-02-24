# Drawer

A more robust dialog that is rendered at the side and provides more space than a usual dialog. Can be helpful for
relational or nested data.

```html
<v-drawer><></v-drawer>
```

## Reference

#### Props

| Prop            | Description | Default             | Type      |
| --------------- | ----------- | ------------------- | --------- |
| `subtitle`      |             | `null`              | `String`  |
| `active`        |             | `undefined`         | `Boolean` |
| `persistent`    |             | `false`             | `Boolean` |
| `icon`          |             | `'box'`             | `String`  |
| `sidebar-label` |             | `i18n.t('sidebar')` | `String`  |
| `title`\*       |             |                     | `String`  |

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
| _default_         |                                                        |      |

#### CSS Variables

| Variable               | Default |
| ---------------------- | ------- |
| `--v-drawer-max-width` | `856px` |
