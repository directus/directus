# Form
Renders a form using interfaces based on the passed collection name.

## Usage
```html
<v-form
	collection="articles"
	:edits.sync="{}"
	:initial-values="{
		title: 'Hello World'
	}"
/>
```

## Props
| Prop            | Description                                                                   | Default |
|-----------------|-------------------------------------------------------------------------------|---------|
| `collection`    | The collection of which you want to render the fields                         | --      |
| `fields`        | Array of fields to render. This can be used instead of the collection prop    | --      |
| `initialValues` | Object of the starting values of the fields                                   | --      |
| `edits`         | The edits that were made after the form was rendered. Being used in `v-model` | --      |

**Note**: You have to pass either the collection or fields prop.

## Slots
n/a

## Events
| Event   | Description              |
|---------|--------------------------|
| `input` | Edits have been updated. |

## CSS Variables
| Variable                  | Default                                |
|---------------------------|----------------------------------------|
| `--v-form-column-width`   | `300px`                                |
| `--v-form-row-max-height` | `calc(var(--v-form-column-width) * 2)` |
| `--v-form-horizontal-gap` | `12px`                                 |
| `--v-form-vertical-gap`   | `52px`                                 |
