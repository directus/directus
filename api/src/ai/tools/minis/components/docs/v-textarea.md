# v-textarea

Multi-line text input for longer content.

## Basic Usage

```json
{
	"type": "v-textarea",
	"props": {
		"modelValue": "state.description",
		"onUpdate:modelValue": "actions.setDescription",
		"placeholder": "Enter description..."
	}
}
```

```javascript
state.description = '';

actions.setDescription = (value) => {
	state.description = value;
};
```

## Props

| Prop                  | Type    | Default  | Description                |
| --------------------- | ------- | -------- | -------------------------- |
| `modelValue`          | string  | null     | Current value              |
| `onUpdate:modelValue` | action  | required | Value change handler       |
| `placeholder`         | string  | null     | Placeholder text           |
| `disabled`            | boolean | false    | Disable the textarea       |
| `autofocus`           | boolean | false    | Focus on mount             |
| `fullWidth`           | boolean | true     | Take full container width  |
| `expandOnFocus`       | boolean | false    | Expand height when focused |
| `nullable`            | boolean | false    | Allow clearing to null     |
| `trim`                | boolean | false    | Trim whitespace on blur    |

## Expand on Focus

Textarea grows when focused, shrinks when blurred:

```json
{
	"type": "v-textarea",
	"props": {
		"modelValue": "state.notes",
		"onUpdate:modelValue": "actions.setNotes",
		"placeholder": "Click to add notes...",
		"expandOnFocus": true
	}
}
```

## With Character Limit Display

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-textarea",
			"props": {
				"modelValue": "state.bio",
				"onUpdate:modelValue": "actions.setBio",
				"placeholder": "Tell us about yourself..."
			}
		},
		{
			"type": "p",
			"props": { "style": "text-align: right; color: var(--theme--foreground-subdued); font-size: 12px;" },
			"children": ["{{ state.bioLength }} / 500 characters"]
		}
	]
}
```

```javascript
state.bio = '';
state.bioLength = 0;

actions.setBio = (value) => {
	if (value.length <= 500) {
		state.bio = value;
		state.bioLength = value.length;
	}
};
```

## Complete Example: Comment Form

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Add Comment"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-textarea",
					"props": {
						"modelValue": "state.comment",
						"onUpdate:modelValue": "actions.setComment",
						"placeholder": "Write your comment...",
						"expandOnFocus": true
					}
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": {
						"onClick": "actions.submitComment",
						"disabled": "state.isCommentEmpty",
						"loading": "state.submitting"
					},
					"children": ["Post Comment"]
				}
			]
		}
	]
}
```

```javascript
state.comment = '';
state.isCommentEmpty = true;
state.submitting = false;

actions.setComment = (value) => {
	state.comment = value;
	state.isCommentEmpty = !value.trim();
};

actions.submitComment = async () => {
	if (state.isCommentEmpty) return;

	state.submitting = true;
	try {
		await createItem('comments', {
			content: state.comment.trim(),
		});
		state.comment = '';
		state.isCommentEmpty = true;
	} finally {
		state.submitting = false;
	}
};
```

## v-textarea vs v-input

| Feature  | v-textarea              | v-input           |
| -------- | ----------------------- | ----------------- |
| Lines    | Multiple                | Single            |
| Use case | Long text, descriptions | Short text, names |
| Resize   | Vertical (automatic)    | Fixed             |
