---
description: This guide shows how to use the live preview feature in Directus when using a Next.js application.
directus_version: 10.2.0
author: Esther Agbaje
---

# Set Up Live Preview With Next.js

<GuideMeta />

Directus' Live Preview feature allows you to show changes in your website before publishing and without the need to
refresh the browser. This is useful when using Directus as a [Headless CMS](https://directus.io/solutions/headless-cms).

[Next.js](https://nextjs.org/) Draft Mode feature renders pages on request instead of build time and fetches draft
content instead of the published content.

By adding a preview URL and setting up your Next.js application, you can instantly see live changes made to your
collection inside of Directus.

## Before You Start

You will need:

- A Directus project. The easiest way to get started with Directus is with our
  [managed Directus Cloud service](https://directus.cloud). You can also self-host Directus.
- A Next.js application.
- Some knowledge of React.js and Next.js.

If you're just getting started with Next.js and Directus, reference our
[guide](/guides/headless-cms/build-static-website/next) to set up Next.js 13 with Directus.

## Configure Live Preview URL in Directus

In your Directus project, create a new `Posts` collection. Add `title` and `content` fields to your collection.

Navigate to Settings -> Data Model and select the collection you want to configure. In the "Preview URL" section,
specify the Preview URL for your Next.js project by selecting ID from the dropdown and entering a URL in this format:
`http://<your-site>/api/draft?secret=MY_SECRET_TOKEN&id=ID`

<video title="Configure live preview URL" autoplay playsinline muted loop controls>
	<source src="https://marketing.directus.app/assets/5e10c4ac-4629-47ae-8c4c-8579945b1e26.mp4" type="video/mp4" />
</video>

Make sure to replace `MY_SECRET_TOKEN` with the secret you want in your Next.js project and save your changes.

## Create Post Pages

We'll need a basic page to display all the posts. For this, create the file `pages.tsx` under `app/posts/[id]` with the
following content:

```tsx
import directus from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';

export default async function Post({ params: { id } }: { params: { id: string } }) {
	const post = await directus.request(readItem('Posts', id));

	if (!post) {
		return null;
	}

	const { title, body } = post;

	return (
		<article>
			<h1>{title}</h1>
			<p>{body}</p>
		</article>
	);
}

export async function generateStaticParams() {
	const posts = await directus.request(
		readItems('Posts', {
			limit: -1,
		})
	);

	return posts.map((post) => ({
		id: String(post.id),
	}));
}
```

## Set Up Draft Mode in Next.js

By default, when rendering content from Directus to a live site using static rendering, changes made to an existing
collection or adding new content require rebuilding the entire site for the changes to take effect. With Draft Mode
enabled, pages can be rendered at request time instead of build time.

In your Next.js application, create a route handler file at `app/api/draft/route.ts` and include the following code:

```ts
import { draftMode } from 'next/headers';
import directus from '@/lib/directus';
import { readItem } from '@directus/sdk';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const secret = searchParams.get('secret');
	const id = searchParams.get('id');

	if (secret !== 'MY_SECRET_TOKEN') {
		return new Response('Invalid token', { status: 401 });
	}

	if (!id) {
		return new Response('Missing id', { status: 401 });
	}

	const post = await directus.request(readItem('Posts', id));

	if (!post) {
		return new Response('Invalid id', { status: 401 });
	}

	draftMode().enable();

	return new Response(null, {
		status: 307,
		headers: {
			Location: `/posts/${post.id}`,
		},
	});
}
```

This code sets the `secret` variable to `MY_SECRET_TOKEN` and validates whether the `secret` parameter in the request
matches the `secret` variable. It also validates the `id` parameter and retrieves the corresponding `post`. In case of
an invalid `id` or `post`, an error response is returned.

The function `draftMode().enable()` is called to activate draft mode, and a response with a status code of 307 is
returned with the `Location` header pointing to the path of the corresponding page.

Learn more about [draft mode](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode) from the
Next.js documentation

## Fetch Post Data with Draft Mode Enabled

To enable draft mode while fetching post data, modify the `pages.tsx` file located in the `app/posts/[id]` directory
with the following code:

```tsx
import directus from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';
import { draftMode } from 'next/headers'; // [!code ++]

export default async function Post({ params: { id } }: { params: { id: string } }) {
	const { isEnabled } = draftMode(); // [!code ++]

	const post = await getPostById(id);

	if (!post) {
		return null;
	}

	const { title, body } = post;

	return (
		<article>
			<h1>{title}</h1>
			<p>{body}</p>
			{isEnabled && <p>(Draft Mode)</p>} // [!code ++]
		</article>
	);
}

export async function generateStaticParams() {
	const posts = await directus.request(
		readItems('Posts', {
			limit: -1,
		})
	);

	return posts.map((post) => ({
		id: String(post.id),
	}));
}
```

The `draftMode` function is imported from the `next/headers` module and determines whether or not draft mode is
currently enabled. If `isEnabled` is true, then the code will show the text "(Draft Mode)" inside a paragraph element.

Run `npm run dev` and visit your preview URL `http:/<your-site>/api/draft?secret=MY_SECRET_TOKEN&id=ID`, you should be
able to see the preview of your content.

## Preview Content in Directus

In an item page, toggle "Enable Preview" at the top of the page. Whenever you create or edit an item in your collection
and “click” save, you should see a live preview of the item on the right-hand side of the screen.

<video title="Enable Preview Mode in Directus" autoplay playsinline muted loop controls>
	<source src="https://marketing.directus.app/assets/f3a670e7-df86-4d04-84a7-589e21ddf841.mp4" type="video/mp4" />
</video>

Clicking on the "Dimensions Display" icon also lets you preview your content on desktop and mobile screens.

## Next Steps

Through this guide, you have successfully set up the live preview feature in Directus for your Next.js project.

Share the preview URL with your team members, stakeholders, or clients to allow them to see how content changes would
look.
