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

| Prop            | Description                                                                                                             | Default |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| `collection`    | The collection of which you want to render the fields                                                                   | --      |
| `fields`        | Array of fields to render. This can be used instead of the collection prop                                              | --      |
| `initialValues` | Object of the starting values of the fields                                                                             | --      |
| `edits`         | The edits that were made after the form was rendered. Being used in `v-model`                                           | --      |
| `loading`       | Display the form in a loading state. Prevents the ctx menus from being used and renders skeleton loaders for the fields | `false` |

**Note**: You have to pass either the collection or fields prop.

## Slots

n/a

## Events

| Event   | Description              |
| ------- | ------------------------ |
| `input` | Edits have been updated. |
