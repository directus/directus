---
description: This recipe outlines a method to generate reports using Directus Flows.
tags: []
skill_level:
directus_version: 9.18.1
author_override:
author: Eron Powell
---

<!--
Pairs well with [workflows](/cookbook/permissions/workflows)
-->

# Generate Work Reports

> {{ $frontmatter.description }}

:::tip Author: {{$frontmatter.author}}

<!-- **Skill Level:** {{$frontmatter.skill_level}}\ -->

**Directus Version:** {{$frontmatter.directus_version}}

<!-- **Tags:** {{$frontmatter.tags.join(", ")}} -->

:::

## Explanation

<!--
See the VitePress docs to learn about its markdown options:
https://vitepress.vuejs.org/guide/markdown
-->

## The Recipe

:::tip Requirements

You'll need something to validate against.

:::

<video autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video>

<!--
VIDEO IS OPTIONAL: delete if not needed
-->

### Get Stakeholders

- cron job
- read data
  - Get relevant authors/managers/etc.
- trigger flow
  - pass array of users/stakeholders into payload

### Generate and Send Report

- another flow: for user in user_list
- read data
  - get data/content using a query
  - get authors and managers
  - send data
- run script (optional)
  - format data for report
- email or notification
  - send to managers or stakeholders

## Final Tips
