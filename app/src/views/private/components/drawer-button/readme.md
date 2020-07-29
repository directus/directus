# Drawer Button

Looks the same as a drawer detail, but can be used as a button / router link.

## Usage

```html
<drawer-button icon="info">Close Sidebar</drawer-button>
```

## Props
| Prop    | Description                                        | Default |
|---------|----------------------------------------------------|---------|
| `icon`* | What icon to render on the left of the button      | `box`   |
| `to`    | router-link to prop. Turns button into router-link | `null`  |

## Events
| Event   | Description                      | Value        |
|---------|----------------------------------|--------------|
| `click` | When the button has been clicked | `MouseEvent` |

## Slots
| Slot      | Description         | Data |
|-----------|---------------------|------|
| _default_ | Title of the button | --   |

## CSS Variables
n/a
