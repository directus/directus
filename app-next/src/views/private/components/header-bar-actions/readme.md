# Header Bar Actions

Wrapper component that will hold all the actions in the right of the header bar. This component is
made to work well with nested `v-button`s, but also works with any other markup.

On mobile, it will only render the last element in the default slot and render a toggle button to
expand / collapse the actions.

## Usage

```html
<header-bar-actions>
	<v-button rounded icon style="--v-button-background-color: var(--success);">
		<v-icon name="add" />
	</v-button>
	<v-button rounded icon style="--v-button-background-color: var(--warning);">
		<v-icon name="delete" />
	</v-button>
	<v-button rounded icon style="--v-button-background-color: var(--danger);">
		<v-icon name="favorite" />
	</v-button>
</header-bar-actions>
```

## Props
n/a

## Slots
| Slot      | Description |
|-----------|-------------|
| _default_ |             |

## Events
| Event           | Description                                           | Value |
|-----------------|-------------------------------------------------------|-------|
| `toggle:sidebar` | Emitted when the user clicks the toggle sidebar button | --    |

## CSS Variables
n/a
