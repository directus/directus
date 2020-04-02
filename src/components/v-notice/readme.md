# Notice

```html
<v-notice>I'm a notice!</v-notice>
```

## Props
| Prop      | Description                                                        | Default |
|-----------|--------------------------------------------------------------------|---------|
| `success` | Shows the success notice                                           | `false` |
| `warning` | Shows the warning notice                                           | `false` |
| `danger`  | Shows the danger notice                                            | `false` |
| `icon`    | Custom icon name, or false if you want to hide the icon completely | `null`  |

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             | --   |

## Events
n/a

## CSS Variables
| Variable                      | Default                    |
|-------------------------------|----------------------------|
| `--v-notice-color`            | `var(--foreground-normal);` |
| `--v-notice-background-color` | `var(--primary-alt);`     |
| `--v-notice-icon-color`       | `var(--primary);`           |
