# Info

Renders a stylized informational placard. It's similar in `v-notice` in it's use case.

```html
<v-info icon="person" title="User Not Found" type="warning">We couldn't find the user you're looking for.</v-info>
```

## Reference

#### Props

| Prop      | Description                                   | Default  | Type                                           |
| --------- | --------------------------------------------- | -------- | ---------------------------------------------- |
| `title`\* | The title to display in the info              |          | `String`                                       |
| `icon`    | What icon to render above the title           | `'box'`  | `String`                                       |
| `type`    | One of `info`, `success`, `warning`, `danger` | `'info'` | `'info' or 'success' or 'warning' or 'danger'` |
| `center`  | Display the info centered                     | `false`  | `Boolean`                                      |

#### Events

n/a

#### Slots

| Slot      | Description                                                  | Data |
| --------- | ------------------------------------------------------------ | ---- |
| _default_ | Default content area. Is rendered within a styled `<p>` tag. |      |
| `append`  | After the main body copy. Can be used to inject buttons etc. |      |

#### CSS Variables

n/a
