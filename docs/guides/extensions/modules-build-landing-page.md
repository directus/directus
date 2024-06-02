---
description: Build your first custom module extension
contributors: Tim Butterfield
---

# Create a Custom Landing Page Module

Modules are an empty canvas in Directus with an empty navigation panel on the left, page header at the top and the
sidebar on the right. This guide will help you set up a multi-page module with navigation in the navigation bar and link
breadcrumbs.

![A custom module has three items in the navigation - Home, Hello World, and Contact Us. The homepage displays an image, three navigation tiles, and some copy.](https://marketing.directus.app/assets/e1d33578-4ebc-4294-9b7c-2cc9ee3a1bfb.png)

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your module.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose module), and type a name for your extension (for example,
`directus-extension-module-landing-page`). For this guide, select JavaScript.

Now that the boilerplate has been created, open the directory in your code editor.

## Define the Config

Open the extension directory that was created in the previous steps then open the directory called `src`. This is where
the source code is located - `index.js` and `module.vue`. Any new files that are required must go in this directory.

As it stands, this module will load an empty page wrapped by the Directus UI:

![An empty module.](https://marketing.directus.app/assets/976ebe2d-4d62-4136-a238-ae2107a8e417.png)

Open `index.js` and make the following changes:

- Update the `id` to the root URI of this landing page. Make sure the `id` is unique between all extensions including
  ones created by 3rd parties.
- Update the `name` to the name of your module. This appears in the page settings where you can enable/disable modules.
- Update the `icon`. You can choose an icon from the library [here](https://fonts.google.com/icons).

```js
import ModuleComponent from './module.vue';

export default {
	id: 'landing-page', // root URI
	name: 'Landing Page',
	icon: 'rocket_launch',
	routes: [
		{
			path: '',
			props: true,
			component: ModuleComponent,
		},
		{
			name: 'page',
			path: ':page',
			props: true,
			component: ModuleComponent,
		},
	],
};
```

The `routes` give you the ability to use different Vue components to render the page and receive props from the URI
path. The path will match anything after `/admin/landing-page/*`. For this reason, the default route will be our home
page.

Create a second route with the path as `:page` to catch anything like `/admin/landing-page/some-page` and use the same
component. The value `some-page` will be available in `props.page` in this example.

### Build the Page

Open the `module.vue` file and the template will look like this:

```vue
<template>
    <private-view title="My Custom Module">Content goes here...</private-view>
</template>

<script>
export default {};
</script>
```

Now you need to build your page inside the `private-view`. Import `ref` and `watch` from `vue` and `useApi` from the
`extensions-sdk` above the export:

```js
import { ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
```

Inside `export default` add the page property to receive the URI value.

```js
props: {
	page: {
		type: String,
		default: null,
	},
},
```

Create a `setup()` section with props and call a function called `render_page` that will be created shortly. Add the
`watch` function to monitor the page property for changes and call the `render_page` function again when a change is
detected. At the bottom, include the return to utilize later.

```js
setup(props) {
	render_page(props.page);

	watch(
		() => props.page,
		() => {
			render_page(props.page);
		}
	);

	return { };
},
```

Directus has a header element at the top of the module that uses the title attribute of the private view as the page
title. This will need to be converted to a variable so it changes when the page changes. It also has a breadcrumb which
will help with page navigation. Create a variable inside the setup called `page_title` and breadcrumb using `ref`.

```js
setup(props) {
	const api = useApi();
	const page_title = ref('');
	const breadcrumb = ref([
		{
			name: 'Home',
			to: `/landing-page`,
		},
	]);

	// Existing code here
},
```

Add `page_title` and `breadcrumb` to the returned objects and create the `render_page` function to update the
`page_title` and `breadcrumb`:

```js
return { page_title, breadcrumb, };

function render_page(page){
	if(page === null){
		page_title.value = '500: Internal Server Error';
		breadcrumb.value[1] = {};
	} else {
		switch(page) {
			case 'home':
				page_title.value = 'Home';
				break;
			case 'hello-world':
				page_title.value = 'Hello World';
				break;
			case 'contact':
				page_title.value = 'Contact Us';
				break;
			default:
				page_title.value = '404: Not Found';
		}


		if(page === 'home'){
			breadcrumb.value[1] = {};
		} else {
			breadcrumb.value[1] = {
				name: page_title.value,
				to: `/landing-page/${page}`,
			};
		}
	}


	console.log(`Title: ${page_title.value}`);
};
```

Ideally this would be an API query instead of the switch case. The `page` variable contains the current URI, use this to
fetch the page details through the API and return the page title. If no result is found in the API, respond with a 404
page. Here is an example:

```js
api.get(`/items/pages?fields=title&filter[uri][_eq]=${page}`).then((rsp) => {
    if(rsp.data.data){
        rsp.data.data.forEach(item => {
            page_title.value = item.title;
        });
    } else {
        page_title.value = "404: Not Found";
    }
}).catch((error) => {
    console.log(error);
});
```

To tie all this together, update the `private-view` `title` attribute to the `page_title` variable, include the
`breadcrumb` using the `#headline` template slot and add the `router-view` element at the bottom. Note that the router
view is linked to the `page` property from the URI.

```html
<private-view :title="page_title">
	<template v-if="breadcrumb" #headline>
		<v-breadcrumb :items="breadcrumb" />
	</template>
	<router-view name="landing-page" :page="page" />
</private-view>
```

Looking at this now, the page title will be Home for the root page and the breadcrumbs are above the title:

![Breadcrumb showing only Home](https://marketing.directus.app/assets/53bd50fc-a247-42d6-9d40-93a97d689eec.png)

When the page changes to `/admin/landing-page/hello-world`, the page title changes and the breadcrumbs are updated:

![Breadcrumb showing both Home and Hello World as a second level item](https://marketing.directus.app/assets/e9aa47d8-0e2e-409a-81a8-f715be739917.png)

## Implement Page Navigation

On the left side is an empty navigation panel where you can add content through template slots.

Create an `all_pages` variable after the breadcrumbs to use for the navigation object:

```js
const page_title = ref('');
const breadcrumb = ref([
	{
		name: 'Home',
		to: `/landing-page`,
	},
]);
const all_pages = ref([]); // [!code ++]
```

Return the object with the others:

```js
return { page_title, breadcrumb }; // [!code --]
return { page_title, breadcrumb, all_pages };  // [!code ++]
```

Create a function called `fetch_all_pages` underneath the `render_pages` function that will output the required object
for a built-in Directus component called `v-list`. Ideally this function will use an API to fetch this information:

```js
function fetch_all_pages(){
	all_pages.value = [
		{
			label: 'Home',
			uri: 'landing-page',
			to: '/landing-page',
			icon: 'home',
			color: '',
		},
		{
			label: 'Hello World',
			uri: 'hello-world',
			to: '/landing-page/hello-world',
			icon: 'public',
			color: '',
		},
		{
			label: 'Contact Us',
			uri: 'contact',
			to: '/landing-page/contact',
			icon: 'phone',
			color: '',
		},
	];
};
```

Here is an example of the above code as an API using a collection in Directus called `pages`:

```js
function fetch_all_pages(){
	api.get('/items/pages?fields=title,uri,icon,color').then((rsp) => {
		all_pages.value = [];
		rsp.data.data.forEach(item => {
			all_pages.value.push({
				label: item.title,
				uri: item.uri,
				to: `/landing-page/${item.uri}`,
				icon: item.icon,
				color: item.color,
			});
		});
	}).catch((error) => {
		console.log(error);
	});
};
```

Run this function after the `render_page` function:

```js
render_page(props.page);
fetch_all_pages();
```

If you need to update the navigation whenever the page changes, you can include this function in the watch callback,
however this can impact performance.

Create a new folder called `components` and create a new vue file called `navigation.vue`. Copy and paste the following
code inside this file:

```vue
<template>
	<v-list nav v-if="pages">
		<v-list-item v-for="navItem in pages" :key="navItem.to" :active="navItem.uri == current" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" :color="navItem.color" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="navItem.label" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>


<script>
export default{
	name: 'PageNavigation',
	inheritAttrs: false,
	props: {
		current: {
			type: String,
			default: null,
		},
		pages: {
			type: Array,
			default: [],
		}
	},
};
</script>
```

This uses the built-in `v-list` and `v-list-item` to render the navigation from the pages property. The current property
is used to set the `v-list-item` to active when the current page matches the navigation item.

:::info Export Names

The export names the component `PageNavigation`. This must match the component import in the module.vue.

:::

To start using the new component in `module.vue`, add it to the `export default` section before the `props`:

```js
export default {
	components: {  // [!code ++]
		PageNavigation,  // [!code ++]
	},  // [!code ++]
	props: {
	}
}
```

Now this can be used in the template. After the `breadcrumbs`, add the following code:

```vue
<template #navigation>
	<page-navigation :current="page" :pages="all_pages"/>
</template>
```

:::info Linting

`PageNavigation` must be a `page-navigation` when used in the template to meet lint syntax standards.

:::

The navigation panel now shows the available pages and will change the page when clicked.

![A module is empty but shows the navigation with three items.](https://marketing.directus.app/assets/aaed210a-7706-42c2-b1e4-558cf481c2a1.png)

## Add Content and Styling

Now that the framework is in place, you can start creating your own template and populate with content. This could be
static content placed within the code or dynamic code from an API. Here is an example to help you get started that will
create a page banner, clickable cards and some paragraphs.

In the template, create the HTML structure after the navigation and some new variables that will contain the content.

```html
<div class="lp-container">
	<div class="lp-banner" v-if="page_banner">
		<img :src="page_banner" alt=""/>
	</div>
	<div class="lp-cards" v-if="page_cards">
		<div class="lp-card" v-for="card in page_cards.filter(item => (item.uri != page))" :key="card.uri" @click="change_page(card.to)">
			<img class="lp-card-image" :src="card.image" alt=""/>
			<span class="lp-card-title">{{ card.label }}</span>
		</div>
	</div>
	<div class="lp-body" v-if="page_body" v-html="page_body"></div>
</div>
```

The three new variables need to be declared:

```js
setup(props) {
	const api = useApi();
	const page_title = ref('');
	const page_banner = ref(''); // [!code ++]
	const page_cards = ref([]); // [!code ++]
	const page_body = ref(''); // [!code ++]

	// Existing code
}
```

Add a new function to change the page called `change_page`. Import the `vue-router` package under the existing vue
import:

```js
import { ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';  // [!code ++]
import PageNavigation from './components/navigation.vue';
```

Assign the router to a variable:

```
setup(props) {
	const router = useRouter();  // [!code ++]
	const api = useApi();
	const page_title = ref('');

	// Existing code
}
```

Create the function before the return and add the three new variables and the new function to the list of returned
items. This will allow them to be used in the template.

```js
function change_page(to){
	const next = router.resolve(`${to}`);
	router.push(next);
}

return { page_title, page_banner, page_cards, page_body, breadcrumb, all_pages, change_page };
```

Inside the render_page function, start adding content to these new variables. Here is an example using static content.

```js
switch(page) {
	case 'home':
		page_title.value = 'Home';
		page_banner.value = '/assets/83BD365C-C3CE-4015-B2AD-63EDA9E52A69?width=2000&height=563&fit=cover';
		page_cards.value = all_pages.value;
		page_body.value = '<p>Lorem ipsum dolor sit amet</p>';
		break;
	case 'hello-world':
		page_title.value = 'Hello World';
		page_banner.value = '/assets/853B243D-A1BF-6051-B1BF-23EDA8E32A09?width=2000&height=563&fit=cover';
		page_cards.value = all_pages.value;
		page_body.value = '<p>Lorem ipsum dolor sit amet</p>';
		break;
	case 'contact':
		page_title.value = 'Contact Us';
		page_banner.value = '/assets/91CE173D-A1AD-4104-A1EC-74FCB8F41B58?width=2000&height=563&fit=cover';
		page_cards.value = [];
		page_body.value = '<p>Lorem ipsum dolor sit amet</p>';
		break;
	default:
		page_title.value = '404: Not Found';
}
```

Or from the internal API providing you have a table with the fields `title`, `banner` (image field) and `content`
(WYSIWYG field):

```js
api.get(`/items/pages?fields=title,banner,content&filter[uri][_eq]=${page}`).then((rsp) => {
	if(rsp.data.data){
		rsp.data.data.forEach(item => {
			page_title.value = item.title;
			page_banner.value = `/assets/${item.banner}?width=2000&height=563&fit=cover`;
			page_body.value = item.content;
		});
	} else {
		page_title.value = "404: Not Found";
	}
}).catch((error) => {
	console.log(error);
});
```

### Work With Images

::: warning DEPRECATED

Since [Directus version 10.10.0](/releases/breaking-changes.html#version-10-10-0) the query parameter authentication is
no longer required and considered deprecated, you can rely on
[session cookies](/reference/authentication.html#access-tokens) instead.

:::

To use internal images, an access token needs to be included in the request. Create a new file called
`use-directus-token.js` and copy the following code:

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
};
```

This will use the access token of the current user to render the images. Alternatively, you can enable Read permissions
on the Public role for the image ID or images with a specific folder ID to remove the need for an access token.

Import the function into the `module.vue` file to make it available in your script:

```js
import useDirectusToken from './use-directus-token';
```

Include the function `AddTokenToURL` as a variable from the new script.

```js
setup(props) {
	const router = useRouter();
	const api = useApi();
	const { addTokenToURL } = useDirectusToken(api);

	// Existing code
}
```

Then wrap any internal images with this function:

```js
page_banner.value = addTokenToURL(`/assets/${item.banner}?width=2000&height=563&fit=cover`);
```

:::info External Images

If you are using images from external sources, the host must be added to the Content Security Policy (CSP) inside the
environment or config file.

:::

## Style the Module

Add some SCSS at the bottom of the `module.vue` file. When dealing with multiple vue files, don’t scope the SCSS,
instead prefix each class with a unique reference to prevent changing other components in Directus. In this example, use
the following SCSS:

```vue
<style lang="scss">
.lp-container {
	padding: var(--content-padding);
	padding-top: 0;
	width: 100%;
	max-width: 1024px;

	&> div {
		margin-bottom: var(--content-padding);
	}
}

.lp-banner {
	border-radius: var(--border-radius);
	overflow: hidden;

	img {
		display: block;
		width: 100%;
	}
}

.lp-cards {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	column-gap: var(--input-padding);
	row-gap: var(--input-padding);

	.lp-card {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		text-align: center;
		border-radius: var(--border-radius);
		padding: var(--input-padding);
		color: white;

		.v-icon {
			width: 100%;
			height: 50px;
			margin-bottom: 6px;

			i {
				font-size: 50px;
				color: white;
			}
		}

		.lp-card-title {
			display: block;
			font-weight: bold;
			font-size: 1.4em;
			line-height: 1.2;
		}
	}
}
</style>
```

This will format the banner, cards and the container. It’s a good idea to make use of the native CSS of Directus as much
as possible so your module appears part of Directus.

Now the page will look like this:

![A custom module has three items in the navigation - Home, Hello World, and Contact Us. The homepage displays an image, three navigation tiles, and some copy.](https://marketing.directus.app/assets/e1d33578-4ebc-4294-9b7c-2cc9ee3a1bfb.png)

Our files are now complete. Build the module with the latest changes:

```shell
npm run build
```

## Add Module to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-module-landing-page`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Module

To use your new module in Directus, you need to enable it in the
[Project Settings](/user-guide/settings/project-settings#modules).

## Summary

You have created a new module from the extension SDK boilerplate template and extended it to multiple pages that make
use of the `vue-router` and utilize the left navigation panel. You can also use the internal API to fetch content and
images from within Directus to surface on the page. From here you can create content rich modules driven by the features
of the Directus platform.

::: code-group

```js [index.js]
import ModuleComponent from './module.vue';

export default {
	id: 'landing-page',
	name: 'Landing Page',
	icon: 'rocket_launch',
	routes: [
		{
			name: 'home',
			path: '',
			props: true,
			component: ModuleComponent,
		},
		{
			name: 'page',
			path: ':page',
			props: true,
			component: ModuleComponent,
		},
	],
};
```

```vue [module.vue]
<template>
	<private-view :title="page_title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #navigation>
			<page-navigation :current="page" :pages="all_pages"/>
		</template>

		<div class="lp-container">
			<div class="lp-banner" v-if="page_banner">
				<img :src="page_banner" alt=""/>
			</div>
			<div class="lp-cards" v-if="page_cards">
				<div class="lp-card" v-for="card in page_cards.filter(item => (item.uri != page))" :key="card.uri" :style="`background-color: ${card.color}`" @click="change_page(card.to)">
					<v-icon :name="card.icon"/>
					<span class="lp-card-title">{{ card.label }}</span>
				</div>
			</div>
			<div class="lp-body" v-if="page_body" v-html="page_body"></div>
		</div>

		<router-view name="landing-page" :page="page" />
	</private-view>
</template>

<script>
import { ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import PageNavigation from './components/navigation.vue';
import useDirectusToken from './use-directus-token.js';

export default {
	components: {
		PageNavigation,
	},
	props: {
		page: {
			type: String,
			default: 'home',
		},
	},
	setup(props) {
		const router = useRouter();
		const api = useApi();
		const { addTokenToURL } = useDirectusToken(api);
		const page_title = ref('');
		const page_banner = ref('');
		const page_cards = ref([]);
		const page_body = ref('');
		const breadcrumb = ref([
            {
                name: 'Home',
                to: `/landing-page`,
            },
        ]);
		const all_pages = ref([]);

		render_page(props.page);
		fetch_all_pages();

		watch(
            () => props.page,
            () => {
                render_page(props.page);
            }
        );

		function change_page(to){
			const next = router.resolve(`${to}`);
			router.push(next);
		}

		return { page_title, page_banner, page_cards, page_body, breadcrumb, all_pages, change_page };

		function render_page(page){
			if(page === null){
				page_title.value = '500: Internal Server Error';
				breadcrumb.value.splice(1, 1);
				page_banner.value = '';
				page_cards.value = [];
				page_body.value = '';
			} else {
				switch(page) {
					case 'home':
						page_title.value = 'Home';
						page_banner.value = addTokenToURL('/assets/83BD365C-C3CE-4015-B2AD-63EDA9E52A69?width=2000&height=563&fit=cover');
						page_cards.value = all_pages.value;
						page_body.value = '<p>Lorem ipsum dolor sit amet.</p>';
						break;
					case 'hello-world':
						page_title.value = 'Hello World';
						page_banner.value = addTokenToURL('/assets/853B243D-A1BF-6051-B1BF-23EDA8E32A09?width=2000&height=563&fit=cover');
						page_cards.value = all_pages.value;
						page_body.value = '<p>Lorem ipsum dolor sit amet.</p>';
						break;
					case 'contact':
						page_title.value = 'Contact Us';
						page_banner.value = addTokenToURL('/assets/91CE173D-A1AD-4104-A1EC-74FCB8F41B58?width=2000&height=563&fit=cover');
						page_cards.value = [];
						page_body.value = '<p>Lorem ipsum dolor sit amet.</p>';
						break;
					default:
						page_title.value = '404: Not Found';
				}

				if(page === 'home'){
					breadcrumb.value.splice(1, 1);
				} else {
					breadcrumb.value[1] = {
						name: page_title.value,
						to: `/landing-page/${page}`,
					};
				}
			}
		}

		function fetch_all_pages(){
			all_pages.value = [
				{
					label: 'Home',
					uri: 'landing-page',
					to: '/landing-page',
					icon: 'home',
					color: '#6644FF',
				},
				{
					label: 'Hello World',
					uri: 'hello-world',
					to: '/landing-page/hello-world',
					icon: 'public',
					color: '#2ECDA7',
				},
				{
					label: 'Contact Us',
					uri: 'contact',
					to: '/landing-page/contact',
					icon: 'phone',
					color: '#3399FF',
				},
			];
			console.log(all_pages.value);
		}
	},
};
</script>

<style lang="scss">
	.lp-container {
		padding: var(--content-padding);
		padding-top: 0;
		width: 100%;
		max-width: 1024px;

		&> div {
			margin-bottom: var(--content-padding);
		}
	}

	.lp-banner {
		border-radius: var(--border-radius);
		overflow: hidden;

		img {
			display: block;
			width: 100%;
		}
	}

	.lp-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		column-gap: var(--input-padding);
    	row-gap: var(--input-padding);

		.lp-card {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			text-align: center;
			border-radius: var(--border-radius);
			padding: var(--input-padding);
			color: white;

			.v-icon {
				width: 100%;
				height: 50px;
				margin-bottom: 6px;

				i {
					font-size: 50px;
    				color: white;
				}
			}

			.lp-card-title {
				display: block;
				font-weight: bold;
				font-size: 1.4em;
				line-height: 1.2;
			}
		}
	}
</style>
```

```vue [components/navigation.vue]
<template>
  <v-list nav v-if="pages">
    <v-list-item v-for="navItem in pages" :key="navItem.to" :active="navItem.uri == current" :to="navItem.to">
      <v-list-item-icon><v-icon :name="navItem.icon" :color="navItem.color" /></v-list-item-icon>
      <v-list-item-content>
        <v-text-overflow :text="navItem.label" />
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script>
export default {
  name: 'PageNavigation',
  inheritAttrs: false,
  props: {
    current: {
      type: String,
      default: null,
    },
    pages: {
      type: Array,
      default: [],
    },
  },
}
</script>
```

```js [use-directus-token.js]
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

:::
