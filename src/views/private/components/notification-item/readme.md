# Notification Item

An individual notification. Shouldn't be used outside of the notification group.

## Usage

```html
<notification-item id="123" title="Hello world!" />
```

## Props
| Prop      | Description                                                  | Default |
|-----------|--------------------------------------------------------------|---------|
| `id`*     | Unique identifier for the notification                       | --      |
| `title`*  | What title to display in the notification                    | --      |
| `text`    | What body text to display in the notification                | --      |
| `icon`    | Icon to render on the left of the notification               | --      |
| `type`    | One of `info`, `success`, `warning`, `error`                 | `info`  |
| `persist` | Prevents notification from dissappearing                     | `false` |
| `tail`    | Show a little tail on the bottom right of the bubble         | `false` |
| `dense`   | Render the notification densely (no body text, less spacing) | `false` |

## Events
n/a

## Slots
n/a

## CSS Variables
n/a
