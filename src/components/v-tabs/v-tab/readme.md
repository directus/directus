# Tab

Individual tab. To be used inside a `v-tabs` context.

## Usage

```html
<v-tabs>
	<v-tab>Schema</v-tab>
	<v-tab>Options</v-tab>
</v-tabs>
```

## Props
| Prop       | Description                                            | Default |
|------------|--------------------------------------------------------|---------|
| `disabled` | Disable the tab                                        | `false` |
| `value`    | A custom value to be used in the selection of `v-tabs` |         |

## Events
n/a

## Slots
| Slot      | Description | Data                                       |
|-----------|-------------|--------------------------------------------|
| _default_ |             | `{ active: boolean, toggle: () => void; }` |

## CSS Variables
| Variable                          | Default                         |
|-----------------------------------|---------------------------------|
| `--v-tab-color`                   | `var(--foreground-normal)` |
| `--v-tab-background-color`        | `var(--background-page)` |
| `--v-tab-color-active`            | `var(--foreground-normal)` |
| `--v-tab-background-color-active` | `var(--background-page)` |
