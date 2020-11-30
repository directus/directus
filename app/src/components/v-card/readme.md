# Card

Renders a card. A card is nothing but a v-sheet with predefined building blocks to enforce consistency.

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

## Props
| Prop       | Description                                       | Default |
|------------|---------------------------------------------------|---------|
| `disabled` | Disable the card, prevents all cursor interaction | `false` |
| `tile`     | Render without rounded corners                    | `false` |

## Events
n/a

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## CSS Variables
| Variable                    | Default            |
|-----------------------------|--------------------|
| `--v-card-min-width`        | `none`             |
| `--v-card-max-width`        | `400px`            |
| `--v-card-min-height`       | `none`             |
| `--v-card-max-height`       | `none`             |
| `--v-card-padding`          | `16px`             |
| `--v-card-background-color` | `var(--background-subdued)` |

---

# Card Title

Functional component that enforces consistent styling.

## Usage

```html
<v-card-title>Hello, world!</v-card-title>
```

## Props
n/a

## Events
n/a

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## CSS Variables
n/a

---

# Card Subtitle

Functional component that enforces consistent styling.

## Usage

```html
<v-card-subtitle>Hello from the subtitle</v-card-subtitle>
```

## Props
n/a

## Events
n/a

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## CSS Variables
n/a

---

# Card Text

Functional component that enforces consistent styling.

## Usage

```html
<v-card-text>Nisi anim deserunt Lorem reprehenderit laborum.</v-card-text>
```

## Props
n/a

## Events
n/a

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## CSS Variables
n/a

---

# Card Actions

Functional component that enforces consistent styling.

## Usage

```html
<v-card-actions>
	<v-button />
	<v-button />
</v-card-actions>
```

## Props
n/a

## Events
n/a

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## CSS Variables
n/a

---
