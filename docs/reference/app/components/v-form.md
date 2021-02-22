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

| Prop             | Description                                                                                                             | Default     | Type                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------- |
| `collection`     | The collection of which you want to render the fields                                                                   | `undefined` | `String`                          |
| `fields`         | Array of fields to render. This can be used instead of the collection prop                                              | `undefined` | `Field[]`                         |
| `initial-values` | Object of the starting values of the fields                                                                             | `null`      | `Object as PropType<FieldValues>` |
| `edits`          | The edits that were made after the form was rendered. Being used in `v-model`                                           | `null`      | `Object as PropType<FieldValues>` |
| `loading`        | Display the form in a loading state. Prevents the ctx menus from being used and renders skeleton loaders for the fields | `false`     | `Boolean`                         |

**Note**: You have to pass either the collection or fields prop.

## Slots

n/a

## Events

| Event   | Description              | Value |
| ------- | ------------------------ | ----- |
| `input` | Edits have been updated. |       |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |
