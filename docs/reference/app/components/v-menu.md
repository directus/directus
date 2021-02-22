# Menu

Renders a dropdown menu. Can be attached to an activator element or free floating.

**NOTE**

Due to the fact that a menu is rendered through a portal, dialogs don't work great when rendered from within a menu. If
you ever find yourself doing this:

## Props

| Prop                     | Description                                                       | Default     | Type                            |
| ------------------------ | ----------------------------------------------------------------- | ----------- | ------------------------------- |
| `placement`              | Where to position the popper.                                     | `'bottom'`  | `String as PropType<Placement>` |
| `value`                  | Value to control menu active state                                | `undefined` | `Boolean`                       |
| `close-on-click`         | Close the menu when clicking outside of the menu                  | `true`      | `Boolean`                       |
| `close-on-content-click` | Close the menu when clicking the content of the menu              | `true`      | `Boolean`                       |
| `attached`               | Attach the menu to an input                                       | `false`     | `Boolean`                       |
| `show-arrow`             | Show an arrow pointer                                             | `false`     | `Boolean`                       |
| `disabled`               | Menu does not appear                                              | `false`     | `Boolean`                       |
| `trigger`                | Activate the menu on a trigger. One of `manual`, `click`, `hover` | `null`      | `String`                        |
| `delay`                  | Time in ms before menu activates after trigger                    | `0`         | `Number`                        |

## Slots

| Slot        | Description  | Data      |
| ----------- | ------------ | --------- | ----------------------------------------------------------------------------------- | --- | --- | --- |
| _default_   | Menu content |           |
| `activator` |              |           |
| <!--        | <!--         | activator | Activator element. Attaches click and mouse enter/leave handlers on wrapper element |     | --> | --> |
| `activator` |              |           |

## CSS Variables

| Variable             | Default |
| -------------------- | ------- |
| `--v-menu-min-width` | `100px` |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## CSS Variables

| Variable             | Default |
| -------------------- | ------- |
| `--v-menu-min-width` | `100px` |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## Props

| Prop                     | Description | Default     | Type                            |
| ------------------------ | ----------- | ----------- | ------------------------------- |
| `placement`              |             | `'bottom'`  | `String as PropType<Placement>` |
| `value`                  |             | `undefined` | `Boolean`                       |
| `close-on-click`         |             | `true`      | `Boolean`                       |
| `close-on-content-click` |             | `true`      | `Boolean`                       |
| `attached`               |             | `false`     | `Boolean`                       |
| `show-arrow`             |             | `false`     | `Boolean`                       |
| `disabled`               |             | `false`     | `Boolean`                       |
| `trigger`                |             | `null`      | `String`                        |
| `delay`                  |             | `0`         | `Number`                        |

## Slots

| Slot        | Description | Data |
| ----------- | ----------- | ---- |
| `activator` |             |      |
| _default_   |             |      |

## CSS Variables

| Variable             | Default |
| -------------------- | ------- |
| `--v-menu-min-width` | `100px` |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## Props

| Prop                     | Description | Default     | Type                            |
| ------------------------ | ----------- | ----------- | ------------------------------- |
| `placement`              |             | `'bottom'`  | `String as PropType<Placement>` |
| `value`                  |             | `undefined` | `Boolean`                       |
| `close-on-click`         |             | `true`      | `Boolean`                       |
| `close-on-content-click` |             | `true`      | `Boolean`                       |
| `attached`               |             | `false`     | `Boolean`                       |
| `show-arrow`             |             | `false`     | `Boolean`                       |
| `disabled`               |             | `false`     | `Boolean`                       |
| `trigger`                |             | `null`      | `String`                        |
| `delay`                  |             | `0`         | `Number`                        |

## Slots

| Slot        | Description | Data |
| ----------- | ----------- | ---- |
| `activator` |             |      |
| _default_   |             |      |

## CSS Variables

| Variable             | Default |
| -------------------- | ------- |
| `--v-menu-min-width` | `100px` |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## Props

| Prop                     | Description | Default     | Type                            |
| ------------------------ | ----------- | ----------- | ------------------------------- |
| `placement`              |             | `'bottom'`  | `String as PropType<Placement>` |
| `value`                  |             | `undefined` | `Boolean`                       |
| `close-on-click`         |             | `true`      | `Boolean`                       |
| `close-on-content-click` |             | `true`      | `Boolean`                       |
| `attached`               |             | `false`     | `Boolean`                       |
| `show-arrow`             |             | `false`     | `Boolean`                       |
| `disabled`               |             | `false`     | `Boolean`                       |
| `trigger`                |             | `null`      | `String`                        |
| `delay`                  |             | `0`         | `Number`                        |

## Slots

| Slot        | Description | Data |
| ----------- | ----------- | ---- |
| `activator` |             |      |
| _default_   |             |      |
