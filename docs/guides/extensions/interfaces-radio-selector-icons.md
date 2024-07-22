---
description: Learn how to create a custom interface showing icons with radio selector options.
contributors: Tim Butterfield, Kevin Lewis
---

# Create A Radio Selector With Icons, SVG, or Images

Interfaces provide a meaningful way for users to provide data. This guide will show you how to create a radio selection
input using icons, SVGs or images where the user selects an option and the value is saved in the database.

![Interface showing three boxes next to each other - each has an image and text.](https://marketing.directus.app/assets/20d77946-e01e-4fac-8916-536b1ccc20d6)

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your interface.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose interface), and type a name for your extension (for example,
`directus-interface-custom-radio-buttons`). For this guide, select JavaScript.

Now the boilerplate has been created, open the directory in your code editor.

## Specify Configuration

Interfaces have 2 parts, the `index.js` configuration file, and the `interface.vue` view. The first part is defining
what information you need to render the interface in the configuration.

Open the `index.js` file and update the existing information relevant to this interface.

```js
import InterfaceIconRadio from './interface.vue';

export default {
	id: 'custom-radio-buttons',
	name: 'Radio Icon Buttons',
	type: 'interface',
	description: 'Radio selection group with icon buttons',
	icon: 'view_carousel',
	component: InterfaceIconRadio,
	options: null,
	types: ['string'],
	recommendedDisplays: ['badge'],
};
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

The value of `types` must be a string or number because a radio group will only output a single value.
`recommendedDisplays` are a way of pinning one or more displays to the top of the list when the user is setting up the
field.

Currently the options object is `null`. An interface can have a set customization options - for this example, the user
must provide selection options. Call the field `choices` with a type of `json`. The meta information is important, this
determines how this field will appear to the user.

```js
options: [
	{
		field: 'choices',
		type: 'json',
		name: 'Choices',
		meta: {
			width: 'full',
			interface: 'list',
			options: {
				template: '{{ text }}',
				fields: [<fields go here>],
			},
		},
	},
],
```

Use the list interface, which requires the options object as seen above. Inside `options`, you must set a `template`
which is how the record is shown to users when presented in a list. Set this to `{{ text }}`, and add a field called
`text`.

The raw essentials for a radio list is the text (label) and the value. Add these to the `fields` object:

```js
[
	{
		field: 'text',
		type: 'string',
		name: 'Text',
		meta: {
			width: 'half',
			interface: 'input',
		},
	},
	{
		field: 'value',
		type: 'string',
		name: 'Value',
		meta: {
			width: 'half',
			interface: 'input',
			options: {
				font: 'monospace',
			},
		},
	},
];
```

Add a field or fields for an icon. For the most flexibility, include SVG, Image and an Icon Picker.

```js
[
	{
		/* field info */
	},
	{
		/* field info */
	},
	{
		/* field info */
	},
	{
		field: 'svg_icon',
		type: 'text',
		name: 'SVG Icon',
		meta: {
			width: 'half',
			interface: 'code',
		},
	},
	{
		field: 'image',
		name: 'Image',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'file-image',
		},
	},
	{
		field: 'icon',
		name: 'Icon',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'select-icon',
		},
	},
];
```

For the SVG icon, use the code interface which allows the user to paste raw SVG code. The image upload uses the built-in
file-image interface which returns the ID of the uploaded/selected image. The icon uses the built-in interface,
select-icon, which provides a searchable dropdown of the icon library.

## Work With Images

::: warning DEPRECATED

Since [Directus version 10.10.0](/releases/breaking-changes.html#version-10-10-0) this is no longer required and you can
rely on [session cookies](/reference/authentication.html#access-tokens) instead.

:::

When working with images inside Directus, you need an access token. Rather than use a static token, create a new file
called `use-directus-token.js` and use the following script that fetches the current user’s access token:

```js
export default function useDirectusToken(directusApi) {
	return {
		addQueryToPath,
		getToken,
		addTokenToURL,
	};

	function addQueryToPath(path, query) {
		const queryParams = [];

		for (const [key, value] of Object.entries(query)) {
			queryParams.push(`${key}=${value}`);
		}

		return path.includes('?') ? `${path}&${queryParams.join('&')}` : `${path}?${queryParams.join('&')}`;
	}

	function getToken() {
		return (
			directusApi.defaults?.headers?.['Authorization']?.split(' ')[1] ||
			directusApi.defaults?.headers?.common?.['Authorization']?.split(' ')[1] ||
			null
		);
	}

	function addTokenToURL(url) {
		const accessToken = getToken();
		if (!accessToken) return url;
		return addQueryToPath(url, {
			access_token: accessToken,
		});
	}
}
```

## Build the View

The `interface.vue` file contains the barebones code required for an interface to work. Import `use-directus-token` by
adding the follow line before `export default`:

```js
import useDirectusToken from './use-directus-token';
```

Inside the `props` object, add the following fields:

```js
props: {
	field: String,
	collection: String,
	value: String,
	disabled: {
		type: Boolean,
		default: false,
	},
	choices: {
		type: Array,
		default: null,
	},
	width: {
		type: String,
		default: null,
	},
},
```

- `field` is the current field that is using the interface. This is defined by the user when setting up their table. You
  will need the field variable to read and write the value.
- `collection` is the name given to the table, this is also required when reading and writing the value.
- `value` is the current value for this field. In a new record this will be null. For existing records, you will need
  this variable to show what option is selected.
- `disabled` is the boolean which tells you when the field has been disabled so you can prevent selection.
- `choices` is the name given to the custom field in the index.js file. This will contain the values from the user when
  they created this field.
- `width` is either half or full. Use this to style the structure of the interface when using a smaller space.

Directly after the `props`, inject the api which is made available by Directus and add the following functions to a new
section called methods.

```js
inject: ['api'],
methods: {
	selectOption(value, field){
		if(field == this.field){
			this.$emit('input', value);
		}
	},
	isChecked(input, value){
		return input == value;
	},
	renderImage(file_id, modified_on = new Date().toISOString()){
		if(file_id === null) return;
		const { addTokenToURL } = useDirectusToken(this.api);
		return addTokenToURL(`/assets/${file_id}?width=42&height=42&fit=cover&cache-buster=${modified_on}`);
	},
	handleChange(value, field) {
		if(field == this.field){
			this.$emit('input', value);
		}
	},
},
```

- `selectOption` will “emit” the value of the selected option into the input and allow the value to be saved to the
  database. In short, this allows the clicked option to be saved.
- `isChecked` will highlight the previously selected option when opening an existing record.
- `renderImage` uses the Directus api and the current user token to fetch the image.
- `handleChange` is a fallback if the value is changed by another interface.

### Create the Template

Add the following code to output an error if no choices are configured for the interface. This goes inside the
`template` tag:

```vue
<v-notice v-if="!choices" type="warning">
	No choices configured
</v-notice>
```

After the `v-notice`, add a `div` for the buttons and use `v-else` from the `if` statement above. The `class` added to
this `div` will be used to style the radio buttons:

```vue
<div v-else class="radio-icon-buttons" :style="{ '--v-radio-color': color, }">
</div>
```

Inside the `div`, add a hidden `input` field which will bind to the selected value.

```vue
<input
	:value="value"
	:field="field"
	:collection="collection"
	type="hidden"
	@input="handleChange($event.target.value, field)"
/>
```

Add an event `onInput` using `@input`, and have it run the `handleChange` function and send the value of `$event.target`
and the current `field` to the function. This is a fallback if anything outside of this interface changes the value.

After the `input` field, add the buttons by looping through the `choices` array.

```vue
<button
	v-for="choice in choices"
	:key="choice.value"
	class="v-icon-radio block"
	type="button"
	:aria-pressed="isChecked(value, choice.value) ? 'true' : 'false'"
	:disabled="disabled"
	:class="{ checked: isChecked(value, choice.value), block }"
	@click="selectOption(choice.value, field)"
>
	<span class="label type-text">
		<v-icon v-if="choice.icon" :name="choice.icon" filled />
		<span v-else-if="choice.svg_icon" class="v-icon" v-html="choice.svg_icon"></span>
		<img v-else-if="choice.image" class="v-icon" :src="renderImage(choice.image)"/>
		<slot name="label">{{ choice.text }}</slot>
	</span>
</button>
```

Add an event to the button using `@click`, to run the `selectOption` function and send the current `choice.value` and
the `field` variable. This will allow the value to be emitted when a choice is clicked.

Inside the button, add the HTML to output the icon, svg or image inside the button. Use the `v-if` directives to control
which take priority if present. This example orders the priority icon, then svg, then image.

![Three icons next to each other with text underneath.](https://marketing.directus.app/assets/b873f262-c653-45ab-bb8e-a8dd30a92ed8)

The buttons currently have no indication that they are selected. At the bottom of `interface.vue`, add the following
under the closing `script` tag:

```vue
<style lang="scss" scoped>
.radio-icon-buttons {
	--columns: 5;
	display: grid;
	grid-gap: 12px 32px;
	grid-template-columns: repeat(var(--columns), 1fr);

	@media (max-width: 600px) {
		--columns: 3;
	}
}

.v-icon-radio {
	display: flex;
	font-size: 0;
	text-align: center;
    background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;
	& .v-icon {
		--v-icon-color: var(--theme--foreground-subdued);
		svg {
			width: 100%;
			height: 100%;
			fill: var(--theme--foreground-subdued);
		}
	}
    & > .v-icon {
		position: absolute;
        display: none;
	}
    & .label {
        display: block;
        width: 100%;
        & .v-icon {
            display: block;
            margin: 0 auto 3px;
            width: 42px;
            height: 42px;
            border: var(--theme--border-width) solid transparent;
            border-radius: 50%;
            padding: 7px;
            background: var(--background-input);
            box-shadow: 0 0 2px rgb(0 0 0 / 30%);
        }
    }
    &:not(.checked) {
        & .label {
            & .v-icon {
                border-color: transparent;
            }
        }
    }
	&:disabled {
		cursor: not-allowed;
		.label {
			color: var(--theme--foreground-subdued);
		}
		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}
	&.block {
		position: relative;
		width: 100%;
		height: auto;
		padding: 10px; // 14 - 4 (border)
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
        &:hover {
            border-color: var(--theme--form--field--input--border-color-hover);
        }
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--theme--background-subdued);
			border-radius: var(--theme--border-radius);
			content: '';
		}
		.label {
			z-index: 1;
		}
	}
	&:not(:disabled):hover {
		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}
	&:not(:disabled).checked {
		.v-icon {
			--v-icon-color: var(--theme--primary);
			svg {
				fill: var(--theme--primary);
			}
		}
		&.block {
			border-color: var(--theme--primary);
			.label {
				color: var(--theme--primary);
			}
			&::before {
				background-color: var(--theme--primary);
				opacity: 0.1;
			}
		}
	}
}
</style>
```

Now, the buttons should be complete:

![Interface showing three boxes next to each other - each has an image and text.](https://marketing.directus.app/assets/20d77946-e01e-4fac-8916-536b1ccc20d6)

Build the interface with the latest changes.

```
npm run build
```

## Add Interface to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-interface-custom-radio-buttons`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Interface

The interface will appear in the list of available interfaces. Create a new field and select the interface from the list
and set options.

![An interface configuration showing an icon button group](https://marketing.directus.app/assets/1dd9d145-d3a1-46a4-bd24-3db6d33418d6)

## Summary

With this interface, you have seen how to use input fields to configure your interface, including string, text, icon
picker, image and lists. You have also learned how to fetch an access token for rendering images, emitting values to the
database and use Vue to render interactive HTML and SCSS.

## Complete Code

`index.js`

```js
import InterfaceIconRadio from './interface.vue';

export default {
	id: 'icon-radio',
	name: 'Icon Button Group',
	type: 'interface',
	description: 'Radio selction group with icon buttons',
	icon: 'view_carousel',
	component: InterfaceIconRadio,
	types: ['string'],
	recommendedDisplays: ['badge'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: 'Choices',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: 'Text',
							meta: {
								width: 'half',
								interface: 'input',
							},
						},
						{
							field: 'value',
							type: 'string',
							name: 'Value',
							meta: {
								width: 'half',
								interface: 'input',
								options: {
									font: 'monospace',
								},
							},
						},
						{
							field: 'svg_icon',
							type: 'text',
							name: 'SVG Icon',
							meta: {
								width: 'half',
								interface: 'code',
							},
						},
						{
							field: 'image',
							name: 'Image',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'file-image',
							},
						},
						{
							field: 'icon',
							name: 'Icon',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-icon',
							},
						},
					],
				},
			},
		},
	],
};
```

`interface.vue`

```vue
<template>
	<v-notice v-if="!choices" type="warning">No choices configured</v-notice>
	<div
		v-else
		class="radio-icon-buttons"
		:style="{
			'--v-radio-color': color,
		}"
	>
		<input
			:value="value"
			:field="field"
			:collection="collection"
			type="hidden"
			@input="handleChange($event.target.value, field)"
		/>
		<button
			v-for="choice in choices"
			:key="choice.value"
			class="v-icon-radio block"
			type="button"
			:aria-pressed="isChecked(value, choice.value) ? 'true' : 'false'"
			:disabled="disabled"
			:class="{ checked: isChecked(value, choice.value), block }"
			@click="selectOption(choice.value, field)"
		>
			<span class="label type-text">
				<v-icon v-if="choice.icon" :name="choice.icon" filled />
				<span v-else-if="choice.svg_icon" class="v-icon" v-html="choice.svg_icon"></span>
				<img v-else-if="choice.image" class="v-icon" :src="renderImage(choice.image)" />
				<slot name="label">{{ choice.text }}</slot>
			</span>
		</button>
	</div>
</template>

<script>
import useDirectusToken from './use-directus-token';
export default {
	inject: ['api'],
	props: {
		field: String,
		collection: String,
		value: String,
		disabled: {
			type: Boolean,
			default: false,
		},
		choices: {
			type: Array,
			default: null,
		},
		width: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	mounted() {
		console.log(`BatchMode: ${this.batchMode}`);
		console.log(`Choices:`);
		console.log(this.choices);
	},
	methods: {
		selectOption(value, field){
			if(field == this.field){
				this.$emit('input', value);
			}
		},
		isChecked(input, value){
			return input == value;
		},
		renderImage(file_id, modified_on = new Date().toISOString()){
			if(file_id === null) return;
			const { addTokenToURL } = useDirectusToken(this.api);
			return addTokenToURL(`/assets/${file_id}?width=42&height=42&fit=cover&cache-buster=${modified_on}`);
		},
		handleChange(value, field) {
			if(field == this.field){
				this.$emit('input', value);
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.radio-icon-buttons {
	--columns: 5;
	display: grid;
	grid-gap: 12px 32px;
	grid-template-columns: repeat(var(--columns), 1fr);

	@media (max-width: 600px) {
		--columns: 3;
	}
}

.v-icon-radio {
	display: flex;
	font-size: 0;
	text-align: center;
    background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;
	& .v-icon {
		--v-icon-color: var(--theme--foreground-subdued);
		svg {
			width: 100%;
			height: 100%;
			fill: var(--theme--foreground-subdued);
		}
	}
    & > .v-icon {
		position: absolute;
        display: none;
	}
    & .label {
        display: block;
        width: 100%;
        & .v-icon {
            display: block;
            margin: 0 auto 3px;
            width: 42px;
            height: 42px;
            border: var(--theme--border-width) solid transparent;
            border-radius: 50%;
            padding: 7px;
            background: var(--background-input);
            box-shadow: 0 0 2px rgb(0 0 0 / 30%);
        }
    }
    &:not(.checked) {
        & .label {
            & .v-icon {
                border-color: transparent;
            }
        }
    }
	&:disabled {
		cursor: not-allowed;
		.label {
			color: var(--theme--foreground-subdued);
		}
		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}
	&.block {
		position: relative;
		width: 100%;
		height: auto;
		padding: 10px; // 14 - 4 (border)
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
        &:hover {
            border-color: var(--theme--form--field--input--border-color-hover);
        }
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--theme--background-subdued);
			border-radius: var(--theme--border-radius);
			content: '';
		}
		.label {
			z-index: 1;
		}
	}
	&:not(:disabled):hover {
		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}
	&:not(:disabled).checked {
		.v-icon {
			--v-icon-color: var(--theme--primary);
			svg {
				fill: var(--theme--primary);
			}
		}
		&.block {
			border-color: var(--theme--primary);
			.label {
				color: var(--theme--primary);
			}
			&::before {
				background-color: var(--theme--primary);
				opacity: 0.1;
			}
		}
	}
}
</style>
```
