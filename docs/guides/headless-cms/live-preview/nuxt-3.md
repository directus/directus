---
description: This guide shows how to use the live preview feature in Directus when using a Nuxt 3 application.
author: Kevin Lewis
directus_version: 10.2.0
---

# Set Up Live Preview With Nuxt 3

<GuideMeta />

Directus' Live Preview feature allows you to show changes in your website collection before publishing and without the
need to refresh the browser.

By adding a preview URL and setting up your Nuxt 3 application, you can instantly see live changes made to your
collection inside of Directus. This is useful when using Directus as a
[Headless CMS](https://directus.io/solutions/headless-cms).

## Before You Start

You will need:

- A Directus project. The easiest way to get started with Directus is with our
  [managed Directus Cloud service](https://directus.cloud). You can also self-host Directus.
- A Nuxt 3 application.
- Some knowledge of Vue and Nuxt.

If you're just getting started with Nuxt and Directus, reference our
[guide](/guides/headless-cms/build-static-website/nuxt-3.html) to set up Nuxt 3 with Directus by creating a custom
plugin. This guide assumes you have already set up the plugin and have access to `this.$directus`, `this.$readItem` and
`this.$readItems` in your project.

In your Directus project, create a new `posts` collection. Add `title` and `content` fields to your collection. Create
an item in the new collection, and make sure the Public role has Read access to the collection.

## Set Up Nuxt

Create an `index.vue` file to load all of the items in the posts collection:

```vue
<template>
	<h1>Blog</h1>
	<ul>
		<li v-for="post in posts" :key="post.id">
			<NuxtLink :href="`/${post.slug}`">
				<h2>{{ post.title }}</h2>
			</NuxtLink>
		</li>
	</ul>
</template>

<script setup>
const { $directus, $readItems } = useNuxtApp()

const posts = await useAsyncData('posts', () => {
  return $directus.request($readItems('posts'))
})
</script>
```

Create a `[id].vue` file that will load for single items in the collection:

```vue
<template>
	<NuxtLink to="/">Home</NuxtLink>
	<h1>{{ post.title }}</h1>
	<div v-html="post.content"></div>
</template>

<script setup>
const { $directus, $readItem } = useNuxtApp();
const route = useRoute();

const post = await useAsyncData('post', () => {
  return $directus.request($readItem('posts', route.params.id))
});

if (!post.value) throw createError({
  statusCode: 404,
  statusMessage: 'Post Not Found'
});
</script>
```

## Configure Live Preview URL in Directus

Navigate to Settings -> Data Model and select the `posts` collection. In the "Preview URL" section, specify the Preview
URL for your Nuxt project by selecting ID from the dropdown and entering a URL in this format:
`http://your-website-url/ID?preview=true`

![Data Studio configuration for Posts collection. The Preview URL is filled in with the dynamic ID and preview true query parameter.](https://marketing.directus.app/assets/6ce322ac-03b1-4555-a7cf-0f33a1d941a7)

## Set Up Preview Plugin

Nuxt 2 had a Preview mode feature, but it has not yet been included in Nuxt 3. A preview mode plugin for Nuxt 3 can be
created using [this snippet](https://github.com/nuxt/nuxt/discussions/18407) from GitHub user `JonathanDoelan`.

Create a `plugins/preview.js` file:

```js
export default defineNuxtPlugin((nuxtApp) => {
	const route = useRoute();
	const preview = route.query.preview && route.query.preview === 'true';

	if (preview) {
		nuxtApp.hook('page:finish', () => {
			refreshNuxtData();
		});
	}

	return { provide: { preview } };
});
```

This plugin checks for the use of a `preview=true` URL parameter. If present, it waits for the page to finish loading
and re-fetches all data dynamically, even if the page is statically-built.

## Fetch Post Data With The `$preview` Helper

In `[id].vue`, access the new `$preview` helper and re-fetch data if `$preview` is true:

```vue
<script setup>
const { $directus, $readItem } = useNuxtApp(); // [!code --]
const { $directus, $readItem, $preview } = useNuxtApp(); // [!code ++]
const route = useRoute();

if ($preview) { // [!code ++]
  const post = await useAsyncData('post', () => { // [!code ++]
    return $directus.request($readItem('posts', route.params.id)) // [!code ++]
  }); // [!code ++]
} // [!code ++]

const post = await useAsyncData('post', () => {
  return $directus.request($readItem('posts', route.params.id))
});

if (!post.value) throw createError({
  statusCode: 404,
  statusMessage: 'Post Not Found'
});
</script>
```

## Preview Content in Directus

In an item page, toggle "Enable Preview" at the top of the page. Whenever you create or edit an item in your collection
and “click” save, you should see a live preview of the item on the right-hand side of the screen.

<video title="Enable Preview Mode in Directus" autoplay playsinline muted loop controls>
	<source src="https://marketing.directus.app/assets/4aa9a902-1724-4c3b-b7ef-66265215df7b.mp4" type="video/mp4" />
</video>

Clicking on the "Dimensions Display" icon also lets you preview your content on desktop and mobile screens.

## Next Steps

Through this guide, you have successfully set up the live preview feature in Directus for your Nuxt 3 project.

Share the preview URL with your team members, stakeholders, or clients to allow them to see how content changes would
look.
