# Modal

A modal is basically an elaborate pre-configured dialog. It supports an optional left sidebar that allows for easier tab usage.

## Usage

```html
<v-modal title="My Modal" v-modal="active">
	Hello, world!
</v-modal>
```

```html
<v-modal title="My Modal">
	<template #activator="{ on }">
		<v-button @click="on">Open modal</v-button>
	</template>

	Hello, world!
</v-modal>
```

```html
<v-modal title="My Modal" v-model="active">
	<template #activator="{ on }">
		<v-button @click="on">Open modal</v-button>
	</template>

	<template #sidebar>
		<v-tabs vertical>
			<v-tab>Hello</v-tab>
			<v-tab>Page 2</v-tab>
			<v-tab>Page 3</v-tab>
		</v-tabs>
	</template>

	<v-tabs-items>
		<v-tab-item>Hello, world!</v-tab-item>
		<v-tab-item>I'm page 2!</v-tab-item>
		<v-tab-item>I'm page 3!</v-tab-item>
	</v-tabs-items>

	<template #footer="{ close }">
		<v-button @click="close">Close modal</v-button>
	</template>
</v-modal>
```

## Props

| Prop         | Description                                                     | Default |
|--------------|-----------------------------------------------------------------|---------|
| `title`*     | Title for the modal                                             |         |
| `subtitle`   | Optional subtitle for the modal                                 |         |
| `active`     | If the modal is active. Used in `v-model`                       | `false` |
| `persistent` | Prevent the user from exiting the modal by clicking the overlay | `false` |

## Events

| Event    | Description              | Value     |
|----------|--------------------------|-----------|
| `toggle` | Sync the `v-model` value | `boolean` |

## Slots
| Slot        | Description                                            | Data                    |
|-------------|--------------------------------------------------------|-------------------------|
| _default_   | Modal content                                          |                         |
| `activator` | Element to enable the modal                            | `{ on: () => void }`    |
| `sidebar`   | Sidebar content for the modal. Often used for `v-tabs` |                         |
| `footer`    | Footer content. Often used for action buttons          | `{ close: () => void }` |

## CSS Variables
n/a
