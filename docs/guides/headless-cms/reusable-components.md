---
description: This guide shows you how to build re-usable page components using Directus Many-to-Any (M2A) relationships.
directus_version: 9.21.4
author: Bryant Gillespie
---

# Create Re-Usable Page Components

> {{ $frontmatter.description }}

## Explanation

Many websites are made of common, repeating sections or groups of content.

A common use case when using Directus as a Headless CMS is creating individual blocks that can be re-used on many
different pages.

This enables your content team create unique page layouts from re-usable components.

To achieve this, you will:

- Map your data model
- Create individual page blocks
- Create your page collection
- Build pages with blocks
- Fetch page data from the API
- Learn tips to work with your front-end

## How-To Guide

::: tip Requirements

You’ll need to have either a Directus Cloud project configured and running or a self-hosted instance of Directus up and
running.

:::

### Map Out Your Data Model

Before creating Collections inside Directus, it’s helpful to map out your data model (schema).

Consider this sample page below.

![Website wireframe that shows three different sections. A hero block with a headline and image, a group of content cards, and a block of rich text.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/sample-page.webp)

There are three main “blocks” that could be broken down into separate components.

1. A hero block at the top of the page that includes a strong headline, an image, and some copy with a call to action.
2. A block of cards that could link out to blog posts or other content.
3. A block of rich text or HTML content.

Let’s break down the data model for each section.

---

![Simple wireframe of a hero section on a sample website.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/block-hero.webp)

**Hero**

- `headline` - short text that grabs attention (string)
- `content` - longer text that explains the product or service (string)
- `buttons` - group of buttons that link out (array of objects)
  - `label` - call to action like Learn More (string)
  - `href` - URL to link to (string)
  - `variant` - type of button like 'default', 'primary’, or 'outline' (string)
- `image` - supporting image (file)

---

![Simple wireframe of a group of content cards on a sample website.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/block-cardgroup.webp)

**Card Group**

- `headline` - short text that describes the section (string)
- `content` - supporting text (textarea)
- `card` - array of objects

  - `image` - featured image of a blog post or content (file)
  - `content` - text summary of a blog post or content (string)

---

![Simple wireframe of a block of rich text on a sample website.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/block-richtext.webp)

**Rich Text**

- `headline` - short text that describes the content (string)
- `content` - rich text / HTML content (string)

---

Now let's create a Collection for each inside Directus.

::: tip

To keep things organized, we recommend that you namespace each collection with a prefix like `block`.

:::

### Create the Rich Text Block

1. [Create a new Collection](/app/data-model/collections#create-a-collection) named `block_richtext` and add the
   following fields.

   ```md
   block_richtext

   - id (uuid)
   - headline (Type: String, Interface: Input)
   - content (Type: Text, Interface: WYSIWYG)
   ```

### Create the Hero Block

2. [Create a new Collection](/app/data-model/collections#create-a-collection) named `block_hero` and add the following
   fields.

   ```md
   block_hero

   - id (uuid)
   - headline (Type: String, Interface: Input)
   - content (Type: Text, Interface: WYSIWYG)
   - buttons (Type: JSON, Interface: Repeater)
     - label (Type: String, Interface: Input)
     - href (Type: String, Interface: Input)
     - variant (Type: String, Interface: Input)
   - image (Type: uuid / single file, Interface: Image)
   ```

### Create the Card Group Block

1. [Create a new Collection](/app/data-model/collections#create-a-collection) named `block_cardgroup` and add the
   following fields.

   ```md
   block_cardgroup

   - id (uuid)
   - headline (Type: String, Interface: Input)
   - content (Type: Text, Interface: WYSIWYG)
   - group_type (Type: String, Interface: Radio, Options: ['posts', 'custom'] )
   - posts (Type: M2M, Conditions: Hide Field on Detail IF group_type === 'posts', Related Collection: posts)
   - cards (Type: O2M, Conditions: Hide Field on Detail IF group_type === 'custom', Related Collection: block_cardgroup_cards)
   ```

### Create the Pages Collection

4. [Create a new Collection](/app/data-model/collections#create-a-collection) named `pages` and add the following
   fields.

   ```md
   pages

   - id (uuid)
   - title (Type: String, Interface: Input)
   - slug (Type: String, Interface: Input, URL Safe: true)
   ```

### Configure a Many-To-Any (M2A) Relationship Inside the `pages` Collection.

5. Create a new Builder (M2A) field inside the `pages` data model.

   ![In the data model settings for the pages collection, a new Many-To-Any relationship is being created. The key is named blocks. There are 3 related collections selected - Block Cardgroup, Block Hero, and Block Rich text.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/reusable-page-components-m2a-screen.webp)

   a. For the **Key**, use `blocks`.

   b. For **Related Collections**, choose the following:

   - Hero
   - Gallery / Cards
   - Article

   c. Enter the Advanced Field Creation Mode. In the Relationship section add a Sort Field (you can just type the word
   'sort'). This will allow you to sort the blocks in the editor.

   d. Save the field. Directus will create a new, hidden
   [junction collection](/app/data-model/relationships#many-to-any-m2a) for you automatically.

::: tip

If you want more control over the name of the junction table and its fields, use the Continue in Advanced Field Creation
Mode option.

:::

### Create Your Page Content

6. [Create a new item](/user-guide/content-module/content/items#create-an-item) in the `pages` collection

   <video title="Create Your Page Content" autoplay muted loop controls playsinline>
   <source src="https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/reusable-page-components-adding-content.mp4"> type="video/mp4" />
   </video>

   a. Enter the page **Title** and **Slug**.

   b. Under the Blocks field, click Create New and choose the collection type to create new blocks. Or click Add
   Existing to re-use existing blocks from other pages. Use the drag handle on the left side of each item to re-order
   blocks.

### Fetching Page Data From the APIs

Next, you'll want to access these with the API. If you try to use `/items/pages` then `blocks` returns an array of IDs.
Instead, you'll want to add a [field parameter](/reference/query#many-to-any-union-types) to get nested relational data.

::: tip

Study the [Global Query Parameters > Fields > Many-To-Any](/reference/query#many-to-any-union-types) article to learn
how to properly fetch nested relational M2A data without over-fetching data that you might not need.

:::

**Sample Request**

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

// Initialize the SDK.
const directus = createDirectus('https://directus.example.com').with(rest());

// Write some code here in your front-end framework that gets the slug from the current URL.
const slug = 'the-ultimate-guide-to-rabbits';

// Fetch page data using the SDK.
const pages = await directus.request(
	readItems('pages', {
		filter: {
			slug: { _eq: slug },
		},
		fields: [
			'*',
			{
				blocks: [
					'*',
					{
						item: {
							block_hero: ['*'],
							block_cardgroup: ['*'],
							block_richtext: ['*'],
						},
					},
				],
			},
		],
		limit: 1,
	})
);
const page = page[0];
```

::: details **Toggle Open to See Sample Response**

```json
{
	"data": [
		{
			"id": "079bf3c0-6f73-4725-b4c3-9d1a6cb58a05",
			"status": "published",
			"date_created": "2023-02-08T20:54:15",
			"user_updated": "9fdd1ca5-982e-422d-bced-640e3a98a339",
			"date_updated": "2023-02-13T17:36:38",
			"user_created": "9fdd1ca5-982e-422d-bced-640e3a98a339",
			"title": "The Ultimate Guide to Rabbits",
			"slug": "the-ultimate-guide-to-rabbits",
			"blocks": [
				{
					"id": 1,
					"pages_id": "079bf3c0-6f73-4725-b4c3-9d1a6cb58a05",
					"sort": 1,
					"collection": "block_hero",
					"item": {
						"id": "1fa9065d-39a0-479a-a8ae-9ccd31429c98",
						"headline": "Learn everything about rabbits",
						"content": "This guide will teach you everything you need to know about those wascally wabbits.",
						"buttons": [
							{
								"label": "Learn More",
								"href": "learn-more",
								"variant": "primary"
							}
						],
						"image": "12e02b82-b4a4-4aaf-8ca4-e73c20a41c26"
					}
				},
				{
					"id": 3,
					"pages_id": "079bf3c0-6f73-4725-b4c3-9d1a6cb58a05",
					"sort": 2,
					"collection": "block_cardgroup",
					"item": {
						"id": "52661ac6-f134-4fbf-9084-17cf3fc4e256",
						"headline": "Our Best Blog Posts on Rabbits",
						"content": "Here's the latest and greatest from our rabid writers.",
						"group_type": "posts",
						"cards": [],
						"posts": [1, 2, 3]
					}
				},
				{
					"id": 2,
					"pages_id": "079bf3c0-6f73-4725-b4c3-9d1a6cb58a05",
					"sort": 3,
					"collection": "block_richtext",
					"item": {
						"id": "6c5df396-be52-4b1c-a144-d55b229e5a34",
						"headline": "The Benefits of Rabbits",
						"content": "<p>Rabbits are a great source of environmental benefit. They help to keep grasslands and other ecosystems in check. Rabbits are herbivores, meaning they eat only plants, which helps to keep vegetation in balance. Additionally, rabbits are crucial to the food chain, providing sustenance for predators in their environment.</p>\n<p>Rabbits also help to improve the quality of soil by digging burrows and depositing their waste in them. This helps to aerate the soil, improving its quality and allowing for better plant growth. Additionally, the waste from rabbits is a rich source of nutrients for plants and other animals in the area. This helps to keep the soil healthy and support the overall ecosystem.</p>"
					}
				}
			]
		}
	]
}
```

:::

### Structuring Your Front End

We have [integration guides](https://directus.io/guides/) for many popular front-end frameworks. But there are far too
many to cover in this recipe.

Here’s some general advice on how to structure your front end to display page blocks / Many-To-Any (M2A) Relationship
data.

**Create a single component for each individual page_builder collection.**

- Hero
- Gallery
- Article

**Create a dynamic route that does the following:**

- Imports your page builder components.
- Calls your `pages` collection via the API. Add a filter rule to match the requested page’s `slug`.
- Maps all the possible `page.pages_blocks.collection` names to your page block components.
- Loops through the `page.blocks` array and passes the correct data (props) that each page_builder component needs to
  render properly.

## Final Tips

This guide has quite a few steps and involves several different collections. Here are some helpful tips to consider.

### Study the API Response

To prevent frustration when building your front-end, it’s important you understand the structure of the JSON data that
Directus returns for Many To Any (M2A) relationships.

- Complete your page builder data model inside Directus.
- Add some content.
- Test your API calls.

### Check Your Permissions

If you notice you aren't receiving the data that you expect, check the Permissions settings for your Public or chosen
role. You'll have to enable Read access for each collection using in the Pages > Blocks Many-To-Any field.

### Use Typescript

We recommend adding types for each of your different collections to your frontend framework.

### Organize Your Data Model with Folders

Consider using [data model folders](/app/data-model/collections#create-a-folder) to keep things nicely organized and
your collections easy to find.

![In the data model settings, a folder is highlighted. It is named blocks. There is a caption that reads "Data Model Folders help you keep collections well-organized and easy to find."](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/reusable-page-components-folders.webp)

### Use Translations for Collection Names

When [setting up Collections](/app/data-model/collections#collection-setup) within your data model, use the Collection
Naming Translations to create names that easier for the Data Studio users to understand.

![In the data model settings for the hero collection a section is highlighted. It reads "Collection naming translations" with a single item called "Hero".](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/reusable-page-components-translations.webp)

For example:

- `block_richtext` becomes `Rich Text`
- `block_hero` becomes `Hero` or `Hero Block`
- `block_cardgroup` becomes `Card Group`
