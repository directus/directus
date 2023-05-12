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

