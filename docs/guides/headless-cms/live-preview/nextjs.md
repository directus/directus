---
description: This guide shows how to use the live preview feature in Directus when using a Next.js application.
tags: []
skill_level:
directus_version: 10.2.0
author_override:
author: Esther Agbaje
---

# Set Up Live Preview With Next.js

> {{ $frontmatter.description }}

Live preview lets users see changes in their collection before publishing it and without the need to refresh the
browser.

[Next.js](https://nextjs.org/) Draft Mode feature renders pages on request instead of build time and fetches draft
content instead of the published content.

By adding a preview URL and setting up your Next.js application, you can instantly see live changes made to your
collection inside of Directus.


## Before You Start

You will need:

- A Directus project. The easiest way to get started with Directus is with our
  [managed Directus Cloud service](https://directus.cloud). You can also self-host Directus.
- A Next.js application.
- Some knowledge of React.js and Next.js

If you're just getting started with Next.js and Directus, reference our
[guide](https://docs.directus.io/guides/headless-cms/build-static-website/next-13.html) to set up Next.js 13 with
Directus

## Configure Live Preview URL in Directus

Go into your Directus instance, create a new collection, and give it a name such as "Posts". Add the necessary fields to
your collection, such as "Title" and "Content."

> Skip to the next step if you already have a collection with the necessary fields.

Navigate to Settings -> Data Model and select the collection you want to configure. In the "Preview URL" section,
specify the Preview URL for your Next.js project by selecting ID from the dropdown and entering a URL in this format:
`http:/<your-site>/api/draft?secret=MY_SECRET_TOKEN&id=ID`

Make sure to replace “MY_SECRET_TOKEN’ with the secret you want in your Next.js project and save your changes.

## Set Up Draft Mode in Next.js

By default, when rendering content from Directus to a live site using static rendering, changes made to an existing
collection or adding new content require rebuilding the entire site for the changes to take effect. With Draft Mode
enabled, pages can be rendered at request time instead of build time.

In your Next.js application, create a route handler such as `app/api/draft/route.ts` and include the following code:

```js
import { draftMode } from 'next/headers';

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

	const post = await getPostById(id);

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

This code sets the `secret` variable to "MY_SECRET_TOKEN" and validates whether the `secret` parameter in the request
matches the `secret` variable. It also validates the `id` parameter and retrieves the corresponding `post`. In case of
an invalid `id` or `post`, an error response is returned.

The function `draftMode().enable()` is called to activate draft mode, and a response with a status code of 307 is
returned with the `Location` header pointing to the path of the corresponding page.

Learn more about [draft mode](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode) from the
Next.js documentation

## Fetch Post Data with Draft Mode Enabled

To enable draft mode while fetching post data, modify the `pages.tsx` file located in the `app/posts/[id]` directory
with the following code:

```js
import { getPostById, getAllPosts } from '@/lib/directus';
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
	const posts = await getAllPosts();

	return posts.map((post) => ({
		id: String(post.id),
	}));
}
```

The `draftMode` function is imported from the `next/headers` module and determines whether or not draft mode is
currently enabled. If `isEnabled` is true, then the code will show the text "(Draft Mode)" inside a paragraph element.

Run `npm run dev` and visit your preview URL `http:/<your-site>/api/draft?secret=MY_SECRET_TOKEN&id=ID`, you should be
able to see the preview of your content.

