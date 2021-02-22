# Info

Renders a stylized informational placard. It's similar in `v-notice` in it's use case.

## Usage

```html
<v-info icon="person" title="User Not Found" type="warning">We couldn't find the user you're looking for.</v-info>
```

## Props

| Prop      | Description                                   | Default                    | Type                                                               |
| --------- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------ | --- | --- |
| <!--      | `title`\*                                     | Title for the info section |                                                                    |     | --> |
| `icon`    | What icon to render above the title           | `'box'`                    | `String`                                                           |
| `type`    | One of `info`, `success`, `warning`, `danger` | `'info'`                   | `String as PropType<'info' or 'success' or 'warning' or 'danger'>` |
| `title`\* |                                               |                            | `String`                                                           |
| `center`  |                                               | `false`                    | `Boolean`                                                          |

## Events

n/a

## Slots

| Slot      | Description                                                  | Data |
| --------- | ------------------------------------------------------------ | ---- |
| _default_ | Default content area. Is rendered within a styled `<p>` tag. |      |
| `append`  | After the main body copy. Can be used to inject buttons etc. |      |

## CSS Variables

n/a
