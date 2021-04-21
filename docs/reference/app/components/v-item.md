# Item

Should be used in combination with `v-item-group` to model the state of active / inactive items. For more information
have a look at the item group component.

## Reference

#### Props

| Prop     | Description                                           | Default        | Type      |
| -------- | ----------------------------------------------------- | -------------- | --------- |
| `value`  | Which value to represent when active                  | `null`         | `String`  |
| `scope`  | Only matches to a group when both scopes are the same | `'item-group'` | `String`  |
| `active` | If the item is currently activated                    | `undefined`    | `Boolean` |
| `watch`  | If the active state should update after initial set   | `true`         | `Boolean` |

#### Slots

| Slot      | Description                 | Data |
| --------- | --------------------------- | ---- |
| _default_ | Where the item content goes |      |
