# Header Bar

The header bar is the header bar displayed above the content of every component that relies on
`private-view`. It needs to have a lot of slots in order to allow the different routes and modules
to control what things are shown, while also providing enough consistency between views.

## Usage

```html
<header-bar title="Global Settings">
	<template #actions>
		<v-button to="/collections/settings/+">
			<v-icon name="add" />
		</v-button>
	</template>
</header-bar>
```

## Navigation toggle / `title-outer:prepend` slot

On mobile views, the `title-outer:prepend` slot is replaced with the navigation toggle button. Never
put any view critical actions in this slot.

## Props
| Prop          | Description                                                                         | Default |
|---------------|-------------------------------------------------------------------------------------|---------|
| `title`*      | The title of the current page                                                       | --      |
| `dense`       | Render the header in a smaller total height, leaving more room for the view content | --      |

## Slots
| Slot                  | Description                                                                                                          |
|-----------------------|----------------------------------------------------------------------------------------------------------------------|
| `title-outer:prepend` | Before the title box. This is hidden on mobile.                                                                      |
| `headline`            | Line above the title. Used for breadcrumbs and other secondary information                                           |
| `title:prepend`       | Before the actual title                                                                                              |
| `title:append`        | After the actual title. Used for status indicator / bookmark toggle                                                  |
| `title-outer:append`  | After the title box.                                                                                                 |
| `actions:prepend`     | Before the action buttons                                                                                            |
| `actions`             | The actual action buttons. This slot is rendered inside [the `header-bar-actions` component](../header-bar-actions/) |
| `actions:append`      | After the actions section.                                                                                           |

## Events
| Event           | Description                              | Value |
|-----------------|------------------------------------------|-------|
| `toggle:nav`    | When the nav toggle button is clicked    | --    |
| `toggle:sidebar` | When the sidebar toggle button is clicked | --    |

## CSS Variables
n/a
