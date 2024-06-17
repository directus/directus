---
description: This guide shows you how build a website with Next.js and Directus as a Headless CMS.
directus_version: 10
author: Kevin Lewis
---

# Build a Website With Next.js and the Directus JavaScript SDK

> {{ $frontmatter.description }}

[Next.js](https://nextjs.org/) is a popular JavaScript framework based on React.js. In this tutorial, you will learn how
to build a website using Directus as a [Headless CMS](https://directus.io/solutions/headless-cms). You will store,
retrieve, and use global metadata such as the site title, create new pages dynamically based on Directus items, and
build a blog.

## Before You Start

You will need:

- To install Node.js and a code editor on your computer.
- To sign up for a Directus Cloud account.
- Some knowledge of React.js and Next.

Create a new Directus Cloud project - any tier and configuration is suitable for this tutorial.

Open your terminal and run the following command to create a new Next project:

```shell
# The options below is what is recommended for a completion of this guide.
# See https://nextjs.org/docs/pages/api-reference/create-next-app
# for all possible options.

npx create-next-app \
  my-website \
  --js \
  --app \
  --eslint \
  --no-src-dir \
  --no-tailwind \
  --import-alias "@/*"
```

Once finished, navigate into the new directory, delete all of the files in `app` so you can build this project from
scratch and install the Directus JavaScript SDK:

```shell
cd my-website
rm app/*
npm install @directus/sdk
```

Now, open `my-website` in your code editor for the following steps.

## Create a Helper for the SDK

To share a single instance of the Directus JavaScript SDK between multiple pages in this project, create a single helper
file that can be imported later. Create a new directory called `lib` and a new file called `directus.js` inside of it.

```js
import { createDirectus, rest } from '@directus/sdk';

const directus = createDirectus('https://directus.example.com').with(rest());

export default directus;
```

::: tip Next.js Caching

Next.js extends the native fetch API with a `force-cache` configuration by default. This means you may sometimes run
into scenarios where Next.js returns stale data. To fix this, update the `rest()` composable as follows:

```js
const directus = createDirectus('https://directus.example.com').with(
  rest({
    onRequest: (options) => ({ ...options, cache: 'no-store' }),
  })
);
```

:::

Ensure your Project URL is correct when initializing the Directus JavaScript SDK.

## Using Global Metadata and Settings

In your Directus project, navigate to Settings -> Data Model and create a new collection called `global`. Under the
Singleton option, select 'Treat as a single object', as this collection will have just a single entry containing global
website metadata.

Create two text input fields - one with the key of `title` and one `description`.

Navigate to the content module and enter the global collection. Collections will generally display a list of items, but
as a singleton, it will launch directly into the one-item form. Enter information in the title and description field and
hit save.

![A form named "Global" has two inputs - a title and a description, each filled with some text.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/next-global-config.webp)

By default, new collections are not accessible to the public. Navigate to Settings -> Access Control -> Public and give
Read access to the Global collection.

Inside of the `app` directory, create a new file called `page.jsx`.

```jsx
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

async function getGlobals() {
	return directus.request(readItems('global'));
}

export default async function HomePage() {
	const global = await getGlobals();
	return (
		<div>
			<h1>{global.title}</h1>
			<p>{global.description}</p>
		</div>
	);
}
```

Type `npm run dev` in your terminal to start the Next development server and open http://localhost:3000 in your browser.
You should see data from your Directus Global collection in your page. Some additional files will be created by Next
that it expects, but do not yet exist - these can be safely ignored for now.

## Creating Pages With Directus

Create a new collection called `pages` - make the Primary ID Field a "Manually Entered String" called `slug`, which will
correlate with the URL for the page. For example `about` will later correlate to the page `localhost:3000/about`.

Create a text input field called `title` and a WYSIWYG input field called `content`. In Access Control, give the Public
role read access to the new collection. Create 3 items in the new collection -
[here's some sample data](https://github.com/directus-community/getting-started-demo-data).

Inside of `app`, create a new directory called `[slug]` with a file called `page.jsx`. This is a dynamic route, so a
single file can be used for all of the top-level pages.

```jsx
import directus from '@/lib/directus';
import { notFound } from 'next/navigation';
import { readItem } from '@directus/sdk';

async function getPage(slug) {
	try {
		const page = await directus.request(readItem('pages', slug));
		return page;
	} catch (error) {
		notFound();
	}
}

export default async function DynamicPage({ params }) {
	const page = await getPage(params.slug);
	return (
		<div>
			<h1>{page.title}</h1>
			<div dangerouslySetInnerHTML={{ __html: page.content }}></div>
		</div>
	);
}
```

Go to http://localhost:3000/about, replacing `about` with any of your item slugs. Using the Directus JavaScript SDK, the
single item with that slug is retrieved, and the page should show your data. `readItem()` allows you to specify the
Primary ID Field.

_Note that we check if a returned value exists, and return a 404 if not. Please also note that
[`dangerouslySetInnerHTML` should only be used for trusted content](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)._

## Creating Blog Posts With Directus

Create a new collection called `authors` with a single text input field called `name`. Create one or more authors.

Then, create a new collection called `posts` - make the Primary ID Field a "Manually Entered String" called `slug`,
which will correlate with the URL for the page. For example `hello-world` will later correlate to the page
`localhost:3000/blog/hello-world`.

Create the following fields in your `posts` data model:

- a text input field called `title`
- a WYSIWYG input field called `content`
- an image relational field called `image`
- a datetime selection field called `publish_date` - set the type to 'date'
- a many-to-one relational field called `author` with the related collection set to `authors`

In Access Control, give the Public role read access to the `authors`, `posts`, and `directus_files` collections.

Create 3 items in the posts collection -
[here's some sample data](https://github.com/directus-community/getting-started-demo-data).

### Create Blog Post Listing

Inside of the `app` directory, create a new subdirectory called `blog` and a new file called `page.jsx` inside of it.

```jsx
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

async function getPosts() {
	return directus.request(
		readItems('posts', {
			fields: ['slug', 'title', 'publish_date', { author: ['name'] }],
			sort: ['-publish_date'],
		})
	);
}

export default async function DynamicPage() {
	const posts = await getPosts();
	return (
		<div>
			<h1>Blog</h1>
		</div>
	);
}
```

This query will retrieve the first 100 items (default), sorted by publish date (descending order, which is latest
first). It will only return the specific fields we request - `slug`, `title`, `publish_date`, and the `name` from the
related `author` item.

Update the returned HTML:

```jsx
	<div>
		<h1>Blog</h1>
		<ul>
			{posts.map((post) => {
				return (
					<li key={post.slug}>
						<h2>
						<a href={`/blog/${post.slug}`}>
							{post.title}
						</a>
						</h2>
						<span>
							{post.publish_date} &bull; {post.author.name}
						</span>
					</li>
				);
			})}
		</ul>
	</div>
```

Visit http://localhost:3000/blog and you should now see a blog post listing, with latest items first.

![A page with a title of "Blog". On it is a list of three items - each with a title, author, and date. The title is a link.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/next-blog-listing.webp)

### Create Blog Post Pages

Each blog post links to a page that does not yet exist. In the `app/blog` directory, create a new directory called
`[slug]`, and within it a `page.jsx` file:

```jsx
import directus from '@/lib/directus';
import { readItem } from '@directus/sdk';
import { notFound } from 'next/navigation';

async function getPost(slug) {
	try {
		const post = await directus.request(
			readItem('posts', slug, {
				fields: ['*', { image: ['filename_disk'], author: ['name'] }],
			})
		);

		return post;
	} catch (error) {
		notFound();
	}
}

export default async function DynamicPage({ params }) {
	const post = await getPost(params.slug);
	return (
		<>
			<img src={`${directus.url}assets/${post.image.filename_disk}?width=600`} alt="" />
			<h1>{post.title}</h1>
			<div dangerouslySetInnerHTML={{ __html: post.content }}></div>
		</>
	);
}
```

Some key notes about this code snippet.

- In the `<img>` tag, `directus.url` is the value provided when creating the Directus plugin.
- The `width` attribute demonstrates Directus' built-in image transformations.
- Once again, `dangerouslySetInnerHTML` should only be used if all content is trusted.

Click on any of the blog post links, and it will take you to a blog post page complete with a header image.

![A blog post page shows an image, a title, and a number of paragraphs.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/next-blog-single.webp)

## Add Navigation

While not strictly Directus-related, there are now several pages that aren't linked to each other. Create the file
`app/layout.jsx` to add a navigation above the main content. Don't forget to use your specific page slugs.

```jsx
import Link from 'next/link';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<nav>
					<Link href="/">Home</Link>{' | '}
					<Link href="/about">About</Link>{' | '}
					<Link href="/conduct">Code of Conduct</Link>{' | '}
					<Link href="/privacy">Privacy Policy</Link>{' | '}
					<Link href="/blog">Blog</Link>
				</nav>
				<main>{children}</main>
			</body>
		</html>
	);
}
```

## Next Steps

Through this guide, you have set up a Next project, created a Directus helper, and used it to query data. You have used
a singleton collection for global metadata, dynamically created pages, as well as blog listing and post pages.

If you want to change what is user-accessible, consider setting up more restrictive roles and accessing only valid data
at build-time.

If you want to build more complex dynamic pages made out of reusable components, check out
[our recipe on doing just this](/guides/headless-cms/reusable-components).

If you want to see the code for this project, you can find it
[on GitHub](https://github.com/directus/examples/blob/main/website-next13).
