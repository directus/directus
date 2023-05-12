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

