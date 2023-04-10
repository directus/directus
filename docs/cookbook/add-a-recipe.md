---
tags: []
skill_level:
directus_version: All Versions
author_override:
author: Eron Powell
---

# Add a Recipe

> This recipe explains what a recipe is and how to add your own recipes in the Directus Cookbook.

:::tip Author: {{$frontmatter.author}}

<!-- **Skill Level:** {{$frontmatter.skill_level}}\ -->

**Directus Version:** {{$frontmatter.directus_version}}

<!-- **Tags:** {{$frontmatter.tags.join(", ")}} -->

:::

## Explanation

What you're reading right now _is the recipe on how to write recipes_. It was written using the same template we use to
write all the other recipes. By the end, you'll know what a recipe is as well as how to plan, propose, write, and submit
your own recipes to the cookbook!

To begin, there are three key parts to a recipe:

- **Explanation** — Explain what the recipe is for, in conceptual terms. In this section, you want to fully prepare your
  readers for what they'll get from your recipe. The goal is that before your readers even begin
  [the recipe](#the-recipe)) below, they should have a general idea of what the recipe is, the steps involved, and
  whether it might fit their needs.
- **The Recipe** — Lays out the recipe itself. This section is mostly task-oriented, with some light explanation
  regarding a specific step in the recipe.
- **Final Tips** — Add any final thoughts, tips, warnings, possibilities, _and beyond!_ This is your chance to answer
  questions that would be hard to address in the previous two sections _(where the reader isn't 100% sure about the
  details of your recipe.)_

:::danger Attention Readers

The goal is for recipes to demonstrate real-world, "production-ready" configuration guides. However, there's no ability
to gauge how a recipe will fit to your project's needs, or its specific data model and configuration details. Make sure
a recipe is safe and practical for your project.

:::

:::warning Attention Contributors

Your **Explanation** should be roughly 1-5 paragraphs. If you feel it _needs_ to be longer:

- You might have _multiple separate recipes_, in which case you should separate them.
- You may be re-explaining things already in the docs, in which case you can use links.

:::

:::tip

The next two sections show you how to submit your own recipe. If you're unsure how to do something in Directus, you can
[open an issue](https://github.com/directus/docs/issues) in the docs repo to make a recipe request!

:::

## The Recipe

:::tip Requirements

To submit recipes, you'll need to fork the docs repo. For details, see our guide on
[running locally](/contributing/running-locally.html).

:::

### Create an Issue

First, we need to confirm your recipe is a viable candidate.

If the cookbook was filled with dozens of recipes showing how to do the exact same thing, it would be a cumbersome
developer experience. Additionally, one's recipe might actually be an inefficient or dangerous way to handle something.
To help avoid these types of issues, we require all potential contributors follow these steps.

1. Search through the Cookbooks to see if your recipe already exists.
2. Go to the docs repo and [open an issue](https://github.com/directus/docs/issues) outlining the general purpose,
   requirements, and steps required for your recipe.

From here, a Directus Core team member will review and reply on the issue. We'll likely have questions or suggestions to
go over before we greenlight an idea. While we don't want to limit recipe contributions, _we do want to avoid_ redundant
or dangerous solutions. If you're unsure if your recipe meets the guidelines, submit an issue anyway and we'll find out
if its a viable recipe together.

### Make a PR for your Recipe

Once your issue has been approved by the Directus Core team, follow these steps.

1. Fork the [docs repo](https://github.com/directus/docs/) and pull it.
2. Copy the starting template, located at `docs/cookbook/template_shell.md`.
3. Paste the file and rename it under the desired recipe section.
4. Go into `docs/.vitepress/config.js` to add the sidebar links to the relevant section. For details, see the VitePress
   documentation on [sidebars](https://vitepress.vuejs.org/guide/theme-sidebar).
5. Create your recipe as desired.
6. Open a PR on the Directus [docs repo](https://github.com/directus/docs/) and reference your issue.
7. When your PR is ready, switch from **Draft** to **Open** to signal it is ready for review. A Directus Core team
   member will look over your work and ask for any necessary edit requests.
8. Make final edits as requested.
9. Run `pnpm run spellcheck` in your terminal and fix spelling issues or add unrecognized words to `/dictionary.txt`.
10. Tag a Directus Core team member for final review when you're ready.

If everything looks good, we'll merge your recipe!

## Final Tips

A couple key points to remember when writing recipes.

### The Structure

When you're writing your recipe, remember the purpose of each section:

- **Explanation** — Tell them what the recipe is for, in conceptual terms.
- **The Recipe** — Tell them the recipe, in step-by-step detail.
- **Final Tips** — Tell them about the recipe. Expand on any possibilities, tips, or warnings.

By structuring your recipe properly, you provide a more consistent experience for your readers. It'll also reduce the
chance a team member asks for edits before merging.

### Redundant Recipes

If your recipe is similar to another existing recipe, its probably in one of three categories:

- It's a 1:1 mapping of an existing recipe _(perhaps with different naming conventions)_.
- It's a superset or a subset of an existing recipe.
- It solves the same problem as an existing recipe, but in a different way.

In the first case, your recipe is more likely _(but not certain)_ to get rejected, however we'll still review it for
consideration. In the other two cases, your recipe may need to be modified, but it's much more likely _(but not
certain)_ to be accepted.

### Breaking the Rules

We created this template to provide a clear scope and style for all recipes. This makes things easier and more
consistent for readers, contributors, and the Directus Core team.

That said.... _it's nice to be able to break the rules sometimes!_

If there's a clear, distinct reason that your recipe should deviate from this template, feel free to tag a team member
that approved your GitHub issue and ask if you can make some modifications. In the end, we always reserve the right to
ask you to re-edit your recipe before we merge your PR... Now with all that said: _Welcome to Docs Land!_ :tada:

:man_cook: **We hope to see your recipe soon!** :woman_cook:
