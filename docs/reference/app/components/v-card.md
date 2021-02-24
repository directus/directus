# Card

A card is nothing but a v-sheet with predefined building blocks to enforce consistency.

## Usage

```html
<v-card>
	<v-card-title>Hello, world!</v-card-title>
	<v-card-subtitle>This is a card</v-card-subtitle>
	<v-card-text>Consectetur enim ullamco sint sit deserunt proident consectetur.</v-card-text>
	<v-card-actions>
		<v-button>Save</v-button>
	</v-card-actions>
</v-card>
```

Cards can be used to consistently style dialogs:

```html
<v-dialog>
	<template #activator="{ on }">
		<v-button @click="on">Show dialog</v-button>
	</template>

	<v-card>
		<v-card-title>Are you sure you want to delete 1 item?</v-card-title>
		<v-card-actions>
			<v-button secondary outlined>Cancel</v-button>
			<v-button>Yes</v-button>
		</v-card-actions>
	</v-card>
</v-dialog>
```

## Reference

#### Props

| Prop       | Description                                       | Default | Type      |
| ---------- | ------------------------------------------------- | ------- | --------- |
| `disabled` | Disable the card, prevents all cursor interaction | `false` | `Boolean` |
| `tile`     | Render without rounded corners                    | `false` | `Boolean` |

#### Events

n/a

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |

#### CSS Variables

| Variable                    | Default                     |
| --------------------------- | --------------------------- |
| `--v-card-min-width`        | `none`                      |
| `--v-card-max-width`        | `400px`                     |
| `--v-card-min-height`       | `none`                      |
| `--v-card-max-height`       | `min-content`               |
| `--v-card-padding`          | `16px`                      |
| `--v-card-background-color` | `var(--background-subdued)` |
| `--v-card-height`           | `auto`                      |

---

# Card Title

Functional component that enforces consistent styling.

## Usage

```html
<v-card-title>Hello, world!</v-card-title>
```
