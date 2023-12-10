---
description: This guide shows you how build a website with SvelteKit and Directus as a Headless CMS.
directus_version: 10.8.2
author: Eike Thies
---

# Build a Website With SvelteKit and the Directus JavaScript SDK

> {{ $frontmatter.description }}

[SvelteKit](https://kit.svelte.dev/) is a popular Companion JavaScript Framework to Svelte.js - focusing on creating
performant web applications easily and fast. In this tutorial, you will learn how to build a website using Directus as a
CMS. You will store, retrieve, and use global metadata such as the site title, create new pages dynamically based on
Directus items, and build a blog.

## Before You Start

You will need:

- To install Node.js and a code editor on your computer.
- To sign up for a Directus Cloud account.
- Some knowledge of Svelte.

## Create Backend (Directus)

Create a new Directus Cloud project - any tier and configuration is suitable for this tutorial. You can also choose to
install Directus [locally](/self-hosted/quickstart.html) via `npm init directus-project backend` and then use
`npx start directus` to fire up the local server.

## Create Frontend (SvelteKit)

Open your terminal and run the following commands to create a new SvelteKit project and add the Directus JavaScript SDK:

```
npm create svelte@latest frontend (Choose Skeleton project)
cd frontend
npm install
npm install @directus/sdk
```

Open `frontend` in your code editor and type `npm run dev` in your terminal to start the Vite development server and
open `http://localhost:5173` in your browser.

### Create a Wrapper for the SDK

We now need to setup the Directus SDK and make it accessible globally. In order to make the best use of SvelteKit's
Server Side Rendering we will need to use SvelteKit's
[own fetch](https://kit.svelte.dev/docs/load#making-fetch-requests) implementation. Create a new file `directus.js`
inside of the `src/libs` folder

```js
import { createDirectus, rest } from '@directus/sdk';
import { readItems, readItem, updateItem, updateUser, createItem, deleteItem } from '@directus/sdk';

function getDirectusInstance(fetch) {
	const directus = createDirectus(import.meta.env.VITE_APIURL, { globals: { fetch } }).with(rest());

	directus.updateUser = async (id, query) => directus.request(updateUser(id, query));
	directus.updateItem = async (collection, id, query) => directus.request(updateItem(collection, id, query));
	directus.readItems = async (collection, query) => directus.request(readItems(collection, query));
	directus.readItem = async (collection, id, query) => directus.request(readItem(collection, id, query));
	directus.createItem = async (collection, query) => directus.request(createItem(collection, query));
	directus.deleteItem = async (collection, id) => directus.request(deleteItem(collection, id));

	return directus;
}

export default getDirectusInstance;
```

In order to make this work we also need to create a `hooks.server.js` file with the following content in the root
directory. It makes sure that the required headers for fetching JavaScript content are returned by the SvelteKit Server

```js
export async function handle({ event, resolve }) {
	return await resolve(event, {
		filterSerializedResponseHeaders: (key, value) => {
			return key.toLowerCase() === 'content-type';
		},
	});
}
```

::: tip

Theoretically you could also make HTTP requests to your Directus server endpoint directly via SvelteKit's `fetch`
implementation. However the Directus SDK offers some nice
[additional features](https://docs.directus.io/guides/sdk/getting-started.html).

:::

Also create the environment variable inside a `.env` file in the root directory

```js
VITE_APIURL = 'https://directus.example.com';
```

Ensure your API URL is correct when initializing the Directus JavaScript SDK.

## Setup Global Metadata and Settings

In your Directus project, navigate to Settings -> Data Model and create a new collection called `global`. Under the
Singleton option, select 'Treat as a single object', as this collection will have just a single entry containing global
website metadata.

Create two text input fields - one with the key of `title` and one `description`.

Navigate to the content module and enter the global collection. Collections will generally display a list of items, but
as a singleton, it will launch directly into the one-item form. Enter information in the title and description field and
hit save.

![A form named "Global" has two inputs - a title and a description, each filled with some text.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/nuxt-global-config.webp)

By default, new collections are not accessible to the public. Navigate to Settings -> Roles & Permissions -> Public and
give Read access to the Global collection.

## Prepare SvelteKit to use Directus instance

Create a new file called `+page.js` in the root directory along the `.page.svelte` file. This file's load function will
be responsible to fetch the data on the client and on the server during Server Side Rendering.

```js
/** @type {import('./$types').PageLoad} */
import getDirectusInstance from '$lib/directus';
export async function load({ fetch }) {
	const directus = getDirectusInstance(fetch);
	return {
		global: await directus.readItems('global'),
	};
}
```

Correspondingly we need to modify the `+page.svelte` file to take the data into account and display it on our site.
SvelteKit magically populates the data property and also updates it should any dependency(variable, url, etc.) change
which influences the data fetch mechanism in the `+page.js` file. Currently there is no dependency, later you will see
how this works.

```svelte
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<h1>{data.global.title}</h1>
<p>{data.global.description}</p>
```

Refresh your browser. You should see data from your Directus Global collection in your page.

## Creating Pages With Directus

Create a new directory called `[slug]`. SvelteKit uses a file based routing mechanism and parameters are always part of
the folder name, whereas the files within the folder are always either +page.js, +page.js or +page.server.js (which is
only run on server side only so it is save to expose secrets in this file). The same concept is true for layout files.
Please refer to the [SvelteKit Documentation](https://kit.svelte.dev/docs/routing) for more information.

Create a new collection called `pages` - make the Primary ID Field a "Manually Entered String" called `slug`, which will
correlate with the URL for the page. For example `about` will later correlate to the page `localhost:5173/about`.

Create a text input field called `title` and a WYSIWYG input field called `content`. In Roles & Permissions, give the
Public role read access to the new collection. Create 3 items in the new collection -
[here's some sample data](https://github.com/directus/examples/blob/main/website-sveltekit/demo-data).

Inside of `[slug]`, create a new file called `+page.js`. This is a dynamic route, so this time we will use the dynamic
`params` object to fetch the correct data. To illustrate how SvelteKit's data loading works you can open a different
page url which will change the `params` object. Evidently this will lead to SvelteKit invalidate the `.page.js` data and
refetch our page data.

```js
/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/directus';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			page: await directus.readItem('pages', params.slug),
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
```

Go to `http://localhost:5173/about`, replacing `about` with any of your item slugs. Using the Directus JavaScript SDK,
the single item with that slug is retrieved, and the page should show your data. `readItem()` only checks against your
`slug` Primary ID Field.

_Note that non existing ids will result in a forbidden error, which we catch and then throw svelte's internal error
object to respond with a 404. Please also note that
[`@html` should only be used for trusted content.](https://svelte.dev/docs/special-tags#html)_

## Creating Blog Posts With Directus

Create a new collection called `authors` with a single text input field called `name`. Create one or more authors.

Then, create a new collection called `posts` - make the Primary ID Field a "Manually Entered String" called `slug`,
which will correlate with the URL for the page. For example `hello-world` will later correlate to the page
`localhost:5173/blog/hello-world`.

Create the following fields in your `posts` data model:

- a text input field called `title`
- a WYSIWYG input field called `content`
- an image relational field called `image`
- a datetime selection field called `publish_date` - set the type to 'date'
- a many-to-one relational field called `author` with the related collection set to `authors`

In Roles & Permissions, give the Public role read access to the `authors`, `posts`, and `directus_files` collections.

Create 3 items in the posts collection -
[here's some sample data](https://github.com/directus/examples/blob/main/website-sveltekit/demo-data).

### Create Blog Post Listing

Create a new Directory called `blog` and a new file called `+page.js` inside of it.

```js
/** @type {import('./$types').PageLoad} */
import getDirectusInstance from '$lib/directus';
export async function load({ fetch }) {
	const directus = getDirectusInstance(fetch);
	return {
		posts: await directus.readItems('posts', {
			fields: ['slug', 'title', 'publish_date', { author: ['name'] }],
			sort: ['-publish_date'],
		}),
	};
}
```

This query will retrieve the first 100 items (default), sorted by publish date (descending order, which is latest
first). It will only return the specific fields we request - `slug`, `title`, `publish_date`, and the `name` from the
related `author` item.

Likewise to before we create a template file `+page.svelte` to show our newly fetched data:

```svelte
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<h1>Blog</h1>
<ul>
	{#each data.posts as post}
		<li>
			<h2>
				<a href="/blog/{post.slug}">
					{post.title}
				</a>
			</h2>
			<span>{post.publish_date} &bull; {post.author.name}</span>
		</li>
	{/each}
</ul>
```

Visit `http://localhost:5173` and you should now see a blog post listing, with latest items first.

![A page with a title of "Blog". On it is a list of three items - each with a title, author, and date. The title is a link.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/nuxt-blog-listing.webp)

### Create Blog Post Listing

Each blog post links to a page that does not yet exist. In the `blog` directory, create a new directory called `[slug]`
with the necessary files as usual:

_.page.js_

```js
/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/directus';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			post: await directus.readItem('posts', params.slug, {
				fields: ['*', { '*': ['*'] }],
			}),
		};
	} catch (err) {
		throw error(404, 'Post not found');
	}
}
```

_.page.svelte_

```svelte
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<img src="{import.meta.env.VITE_APIURL}/assets/{data.post.image.filename_disk}?width=600" alt="" />
<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>
```

\_If the image is not showing up for you, you might have forgotten to also give the directus_files collection read
access as described above. This is due to that by default the file object only includes the image name, but not the
metadata, which we need to get the actual binary file from the Directus endpoint. To fix this go to Roles & Permissions,
give the Public role read access to the `directus_files` collection.

Some key notes about this code snippet.

- The `width` attribute demonstrates Directus' built-in image transformations.
- Once again, `@html` should only be used if all content is trusted.
- Because almost-all fields are used in this page, including those from the `image` relational field, the `fields`
  property when using the Directus JavaScript SDK can be set to `*.*`.

Click on any of the blog post links, and it will take you to a blog post page complete with a header image.

![A blog post page shows an image, a title, and a number of paragraphs.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/nuxt-blog-single.webp)

## Add Navigation

While not strictly Directus-related, there are now several pages that aren't linked to each other. Let's add a
`+layout.svelte` file to the root directory and add a navigation. Don't forget to use your specific page slugs.

```svelte
<a href="/">Home</a>
<a href="/about">About</a>
<a href="/conduct">Code of Conduct</a>
<a href="/privacy">Privacy Policy</a>
<a href="/blog">Blog</a>
<div>
	<slot />
</div>
```

## Next Steps

Through this guide, you have set up a SvelteKit project, created a Directus Wrapper, and used it to query data. You have
used a singleton collection for global metadata, dynamically created pages, as well as blog listing and post pages.

If you want to change what is user-accessible, consider setting up more restrictive roles and accessing only valid data
at build-time.

If you want to build more complex dynamic pages made out of reusable components, check out
[our recipe on doing just this](/guides/headless-cms/reusable-components).

If you want to see the code for this project, you can find it
[on GitHub](https://github.com/directus/examples/blob/main/website-sveltekit).
