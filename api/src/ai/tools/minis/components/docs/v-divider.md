# v-divider

Horizontal or vertical line for separating content.

## Basic Usage

```json
{
	"type": "v-divider"
}
```

## Props

| Prop          | Type    | Default | Description                             |
| ------------- | ------- | ------- | --------------------------------------- |
| `vertical`    | boolean | false   | Display as vertical line                |
| `inlineTitle` | string  | null    | Text to display inline with the divider |
| `large`       | boolean | false   | Larger margins                          |

## Horizontal Divider

```json
{
	"type": "div",
	"children": [
		{ "type": "p", "children": ["Content above"] },
		{ "type": "v-divider" },
		{ "type": "p", "children": ["Content below"] }
	]
}
```

## With Inline Title

```json
{
	"type": "v-divider",
	"props": { "inlineTitle": "OR" }
}
```

## Large Margins

```json
{
	"type": "v-divider",
	"props": { "large": true }
}
```

## Vertical Divider

```json
{
	"type": "div",
	"props": { "style": "display: flex; align-items: center; gap: 16px; height: 40px;" },
	"children": [
		{ "type": "span", "children": ["Left"] },
		{ "type": "v-divider", "props": { "vertical": true } },
		{ "type": "span", "children": ["Right"] }
	]
}
```

## In Card

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Settings"] },
		{ "type": "v-card-text", "children": ["General settings here..."] },
		{ "type": "v-divider" },
		{ "type": "v-card-text", "children": ["Advanced settings here..."] }
	]
}
```

## Section Separator

```json
{
	"type": "div",
	"children": [
		{ "type": "h2", "children": ["Section 1"] },
		{ "type": "p", "children": ["Content..."] },
		{ "type": "v-divider", "props": { "large": true, "inlineTitle": "Next Section" } },
		{ "type": "h2", "children": ["Section 2"] },
		{ "type": "p", "children": ["More content..."] }
	]
}
```
