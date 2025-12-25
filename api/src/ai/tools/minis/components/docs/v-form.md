# v-form

Dynamic form renderer based on Directus field schemas. This is an advanced component that renders forms from collection
field definitions.

> **Note:** v-form is a complex Tier 4 component. For simple forms, consider building forms manually with v-input,
> v-select, v-checkbox, etc. Use v-form when you need to render forms that match a Directus collection's schema.

## Basic Usage

```json
{
	"type": "v-form",
	"props": {
		"modelValue": "state.formData",
		"onUpdate:modelValue": "actions.updateFormData",
		"fields": "state.fields",
		"primaryKey": "+"
	}
}
```

## Props

| Prop                  | Type    | Default  | Description                               |
| --------------------- | ------- | -------- | ----------------------------------------- |
| `modelValue`          | object  | {}       | Form data object                          |
| `onUpdate:modelValue` | action  | required | Data change handler                       |
| `fields`              | array   | []       | Field definitions (Directus field schema) |
| `primaryKey`          | string  | "+"      | Primary key ("+" for new items)           |
| `disabled`            | boolean | false    | Disable all fields                        |
| `loading`             | boolean | false    | Show loading state                        |
| `validationErrors`    | array   | []       | Validation errors to display              |

## Field Definition Structure

Fields follow the Directus field schema format:

```javascript
state.fields = [
	{
		field: 'title',
		name: 'Title',
		type: 'string',
		meta: {
			interface: 'input',
			required: true,
			options: {
				placeholder: 'Enter title...',
			},
		},
		schema: {
			is_nullable: false,
		},
	},
	{
		field: 'description',
		name: 'Description',
		type: 'text',
		meta: {
			interface: 'input-multiline',
			options: {
				placeholder: 'Enter description...',
			},
		},
	},
	{
		field: 'status',
		name: 'Status',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'Draft', value: 'draft' },
					{ text: 'Published', value: 'published' },
					{ text: 'Archived', value: 'archived' },
				],
			},
		},
	},
];
```

## Common Interface Types

| Interface                  | Use Case             |
| -------------------------- | -------------------- |
| `input`                    | Single-line text     |
| `input-multiline`          | Multi-line text      |
| `select-dropdown`          | Single selection     |
| `select-multiple-checkbox` | Multiple selection   |
| `boolean`                  | True/false toggle    |
| `datetime`                 | Date and time picker |
| `input-rich-text-html`     | Rich text editor     |

## Simple Form Example

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Create Item"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-form",
					"props": {
						"modelValue": "state.formData",
						"onUpdate:modelValue": "actions.setFormData",
						"fields": "state.fields",
						"primaryKey": "+",
						"loading": "state.isLoading",
						"validationErrors": "state.errors"
					}
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": { "secondary": true, "onClick": "actions.cancel" },
					"children": ["Cancel"]
				},
				{
					"type": "v-button",
					"props": { "onClick": "actions.save", "loading": "state.isSaving" },
					"children": ["Save"]
				}
			]
		}
	]
}
```

```javascript
state.formData = {
	title: '',
	description: '',
	status: 'draft',
};
state.isLoading = false;
state.isSaving = false;
state.errors = [];

state.fields = [
	{
		field: 'title',
		name: 'Title',
		type: 'string',
		meta: {
			interface: 'input',
			required: true,
			width: 'full',
			options: { placeholder: 'Enter title' },
		},
		schema: { is_nullable: false },
	},
	{
		field: 'description',
		name: 'Description',
		type: 'text',
		meta: {
			interface: 'input-multiline',
			width: 'full',
			options: { placeholder: 'Enter description' },
		},
	},
	{
		field: 'status',
		name: 'Status',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			width: 'half',
			options: {
				choices: [
					{ text: 'Draft', value: 'draft' },
					{ text: 'Published', value: 'published' },
				],
			},
		},
	},
];

actions.setFormData = (data) => {
	state.formData = data;
};

actions.save = async () => {
	state.isSaving = true;
	state.errors = [];

	try {
		await createItem('articles', state.formData);
		// Success - clear form or navigate
		state.formData = { title: '', description: '', status: 'draft' };
	} catch (error) {
		if (error.errors) {
			state.errors = error.errors;
		}
	} finally {
		state.isSaving = false;
	}
};
```

## Edit Existing Item

```javascript
state.primaryKey = null;
state.formData = {};

actions.init = async () => {
	state.isLoading = true;

	try {
		const item = await readItem('articles', state.itemId);
		state.formData = item;
		state.primaryKey = item.id;
	} finally {
		state.isLoading = false;
	}
};

actions.save = async () => {
	state.isSaving = true;

	try {
		await updateItem('articles', state.primaryKey, state.formData);
	} finally {
		state.isSaving = false;
	}
};
```

## When to Use v-form vs Manual Forms

### Use v-form when:

- Rendering forms that match a Directus collection's schema
- Need automatic interface selection based on field types
- Building generic CRUD interfaces

### Use manual forms when:

- You need full control over layout
- Form doesn't map to a collection
- Simple forms with few fields
- Custom validation logic

### Manual Form Alternative:

```json
{
	"type": "div",
	"props": { "style": "display: flex; flex-direction: column; gap: 16px;" },
	"children": [
		{
			"type": "div",
			"children": [
				{ "type": "label", "children": ["Title *"] },
				{
					"type": "v-input",
					"props": {
						"modelValue": "state.title",
						"onUpdate:modelValue": "actions.setTitle",
						"placeholder": "Enter title"
					}
				}
			]
		},
		{
			"type": "div",
			"children": [
				{ "type": "label", "children": ["Description"] },
				{
					"type": "v-textarea",
					"props": {
						"modelValue": "state.description",
						"onUpdate:modelValue": "actions.setDescription",
						"placeholder": "Enter description"
					}
				}
			]
		},
		{
			"type": "div",
			"children": [
				{ "type": "label", "children": ["Status"] },
				{
					"type": "v-select",
					"props": {
						"modelValue": "state.status",
						"onUpdate:modelValue": "actions.setStatus",
						"items": [
							{ "text": "Draft", "value": "draft" },
							{ "text": "Published", "value": "published" }
						]
					}
				}
			]
		}
	]
}
```

## Notes

- v-form is powerful but complex - use simpler components when possible
- Field definitions must follow Directus field schema format
- The `primaryKey` prop is "+" for new items, or the actual ID for editing
- Validation errors should match the format `[{ field: 'title', message: 'Required' }]`
- Consider loading fields dynamically from collection metadata for truly dynamic forms
