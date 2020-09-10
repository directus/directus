# Detail

Allows for collapsable content

## Usage

```html
<v-detail />
```

## Props

| Prop     | Description         | Default        |
|----------|---------------------|----------------|
| `active` | Used with `v-model` | `false`        |
| `label`  | Label of detail     | `$t('toggle')` |

## Events
| Event    | Description                 | Value     |
|----------|-----------------------------|-----------|
| `toggle` | New active value of divider | `boolean` |

## Slots

| Slot      | Description                   | Data                  |
|-----------|-------------------------------|-----------------------|
| _default_ | Content of the detail section |                       |
| `title`   | Content to render in divider  | `{ active: boolean }` |

## CSS Variables
n/a
