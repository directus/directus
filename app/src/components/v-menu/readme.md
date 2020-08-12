# Menu

Renders a dropdown menu. Can be attached to an activator element or free floating.

**NOTE**

Due to the fact that a menu is rendered through a portal, dialogs don't work great when rendered from
within a menu. If you ever find yourself doing this:

## Props

| Prop                     | Description                                                       | Default     |
|--------------------------|-------------------------------------------------------------------|-------------|
| `placement`              | Where to position the popper.                                     | `bottom`    |
| `value`                  | Value to control menu active state                                | `undefined` |
| `close-on-click`         | Close the menu when clicking outside of the menu                  | `true`      |
| `close-on-content-click` | Close the menu when clicking the content of the menu              | `true`     |
| `attached`               | Attach the menu to an input                                       | `false`     |
| `show-arrow`             | Show an arrow pointer                                             | `false`     |
| `disabled`               | Menu does not appear                                              | `false`     |
| `trigger`                | Activate the menu on a trigger. One of `manual`, `click`, `hover` | `null`      |
| `delay`                  | Time in ms before menu activates after trigger                    | `0`         |

## Slots

| Slot      | Description                                                                         | Data |
| --------- | ----------------------------------------------------------------------------------- | ---- |
| _default_ | Menu content                                                                        |      |
| activator | Activator element. Attaches click and mouse enter/leave handlers on wrapper element |      |
