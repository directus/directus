# v-sheet

Simple container component with background color. Lighter than v-card, no shadow.

## Basic Usage

```json
{
	"type": "v-sheet",
	"children": ["Content inside a sheet"]
}
```

## Props

| Prop | Type | Default | Description                               |
| ---- | ---- | ------- | ----------------------------------------- |
| None | -    | -       | v-sheet is a pure container with no props |

## Use Cases

### Background Section

```json
{
	"type": "v-sheet",
	"props": { "style": "padding: 20px; margin-bottom: 16px;" },
	"children": [
		{ "type": "h3", "children": ["Section Title"] },
		{ "type": "p", "children": ["Section content with a subtle background."] }
	]
}
```

### Grouped Content

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-sheet",
			"props": { "style": "padding: 16px; margin-bottom: 8px;" },
			"children": [
				{ "type": "strong", "children": ["Group 1"] },
				{ "type": "p", "children": ["First group content"] }
			]
		},
		{
			"type": "v-sheet",
			"props": { "style": "padding: 16px;" },
			"children": [
				{ "type": "strong", "children": ["Group 2"] },
				{ "type": "p", "children": ["Second group content"] }
			]
		}
	]
}
```

## v-sheet vs v-card

| Feature       | v-sheet          | v-card             |
| ------------- | ---------------- | ------------------ |
| Shadow        | No               | Yes                |
| Border radius | Minimal          | Rounded            |
| Structure     | Simple container | Title/text/actions |
| Use case      | Subtle grouping  | Prominent content  |
