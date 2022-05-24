 <!--

 Miscellaneous Questions

- Glossaries
- Linking Things
- Defining a "Feature" -> The document's "topic" -> "Scoping a doc".
- Definining the extent of a tutorial/process.
  - Insights' "How it Works" combines CRUD into one operation.
  - Cloud/Content/others CRUD operations are separate.
- Before you Begin has a super simple link to a "getting started" section which
is a pre-requisite to reading all  documentation. It should be a 30-90 minute read.

-->

# Documentation Guidelines

> This page outlines how to go about writing Directus Documentation. The purpose is to help core team members and other
> contributors keep content crystal-clear and well-organized, while sure media assets look sharp and on-brand.

[[toc]]

:::tip Before You Begin

Please see the [Vuepress](https://vuepress.vuejs.org/guide/#how-it-works) Documentation, as this is the SSG Directus
uses to power the docs and you'll need an overview of its features and functionality. Please also see the
[Introduction](/contributing/introduction/) to Contributing and also [Running Locally](/contributing/running-locally/)
so you can see your edits. <!-- @TODO getting-started > documentation-overview -->

:::

## Overview

You may notice the following sections in the left-hand navbar:

- **Getting Started**
- **App Guide**
- **Configuration**
- **API Reference**
- **Extensions**
- **Contributing**
- **Self Hosted**
- **Directus Cloud**

Each of these sections stores information of varying technical degree. The following user personas _and their assumed
technical knowledge_ should be accounted for when writing documentation.

<!-- @TODO getting-started > introduction --- We may want to link this to the introduction instead?? -->

- **Business Users**\
  Blog Writers, Clerks, Accountants, etc. Zero knowledge of code or data.

- **Power Users & Analysts**\
  Analysts and Data scientists. Deep knowledge of data, but no web development skills.

- **Admins & Developers**\
  Project leads with web development knowledge, and no knowledge of Directus architecture.

- **Contributors**\
  Developers with knowledge of Directus architecture as well as Typescript, Node and Vue.

## General Workflow Tips

It can be easy to get off track or skip steps while writing documentation. The following tips will help you stay
organized through each phase of the production cycle.

<!-- @TODO Incorporate the "9-step plan" I created. -->

### Before You Begin

- Thoroughly test all the features that you plan to document and take good notes.
- Use these ntoes to prepare a clear outline structure.
- Book an interview to run the draft outline by a manager and get it approved.
- Create a [draft PR on GitHub](https://github.com/directus/directus/pulls)

### While You're Writing

- Focus on active voice sentences.
- Avoid repeating yourself and link to an existing explanation whenever possible.
- You can say _you/your_ or keep it 3rd person. But whatever you choose, keep it consistent.
- Capitalize any term that is specific to Directus. When in doubt, see if it is in the
  [Glossary](/getting-started/glossary/).
- Use [Grammarly](https://app.grammarly.com/) and most big grammar issues will fall into control automatically.
- Feel free to make a small joke and add a little personality, _but don't to be a comedian!_
- Try to create media _after_ managerial review, _because the document may change drastically_.
- Create HTML notes for future tasks:\
  You may find that documentation needs to reference or get refactored into a new documentation page which is not yet written.
  When this happens, make an HTML comment:\
  `<!-- @TODO docs-section > future-doc-page "some optional note" -->`\
  Later on, you can use VSC's search function to search `@TODO docs-section > future-doc-page` and add whatever you need.

### Final Proofedits Checklist

- Remove text widows.
- Make sure all [Notes](#while-youre-writing) are closed out.
- Spell out number when writing an integer less than 10 _(unless it is money, fractions, etc.)._\
- Deep linking: Never change Headers once finalized.\
  Perhaps we can use a broken link finder? Haven't looked into this.
- Avoid slashes, try for commas instead. _(e.g. word/term -> word or term_).
- The long hyphen `—` is used after key terms `shift + option + "-"` on a mac.
- Period at end of `ul` and `ol` items.
- Capitalization of Directus Terms.
- Make sure you followed Global Styles as close as possible.
- Use VSC to search `@TODO this-docs-section > this-docs-page` and handle any html notes.

## Punctuation and Styling

These style tips apply across all documentation. It is important to have consistent style, punctuation and prose _as
these drastically improve clarity_.

### Lists and Terms

You can format lists one of several ways, depending on your needs. Be sure to use the _em dash hyphen:_ `shift option -`
when needed, and always end with a period.

- **One-liner Term** — Some useful explanation goes here. Try to keep it on one line.

```md
- **One-liner Term** — Some useful explanation goes here. Try to keep it on one line.
```

- **Multi-line Term**\
  Some useful explanation goes here. No need to keep it to one line as the purpose is to write much longer explanations than
  you could on just one line!

```md
**Multi-line Term**\
Some useful explanation goes here. No need to keep it on one line as the purpose is to write much longer explanations than
you could on just one line.
```

[Linked Term]() — Some short explanation in front of a term that links to a longer explanation.

```md
[Linked Term](docs-section/docs-page/#title) — Some short explanation in front of a term that links to a longer
explanation.
```

<!--
### Inline Icons

[Material Design Icons](https://fonts.google.com/icons) — The icons we use in Directus.

### ?

 -->

## Images and Videos

The following guidelines apply to all media creation.

- Use a clean browser _(Chrome or Safari)_ with no avatars, extra tabs, or widgets visible.
- On Google Chrome, please use the Directus logo as the user avatar.
- Use real-world examples in your demonstrations as much as possible.
- Maintain business professional language on any text visible in the media.
- Be sure to hide scroll-bars on your browser window, as these don't look so good on camera.
- Don't go overkill. Shouldn't take more than 10 minutes to make a screenshot or video.
- The docs media CSS is `width: 100%;`. Take the screen caps on any "normal" size monitor.

:::tip

Media hosting and uploading are handled by the Directus Core Team.

:::

### Images

All images in our documentation are webp.

1. Fill the monitor with your browser window, but don't maximize it to a new page.
2. Disable the image dropshadow and screenshot the entire window with this command:\
   `Command + Shift + 4 + Spacebar + Option`
3. Convert the screenshot _(likely an huge PNG)_ into webp with [Squoosh](squoosh.app).\
    _Note: Feel free to use Squoosh's default webp settings._

:::tip

Squoosh also has a [batch-convert CLI Tool](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli).

:::

### Videos

To create a video, follow these steps:

1. Fill the monitor with your browser window, but don't maximize it to a new page.
2. Use `ctrl + shift + f5` and the screen record options menu will appear. For basic _watch-only_ videos, be sure audio
   recording is turned off.
3. Choose the "Record Selected Portion" option.\
    _Note: you can hover over each button to see it title as a tooltip._
4. Hit **Record** and make your video as planned.\
   _Note: Be sure plan your mouseover motions and example text ahead of time so its crispy._
5. Use [Handbrake](https://handbrake.fr/) to make your screen records 10-20x smaller.\
   Use these settings, which are all visible on the front-page when you open Handbrake:
   - Preset: Fast 1080p 30fps
   - Format: MP4
   - Web Optimized

<!--
## Getting Started Structure
Target users are everyone but the goal is to get them on the right track.
 -->

## App Guide Structure

### Page Structure

The following markdown snippet outlines how App Guide docs are to be structured.

```md
# Page Title

> Blockquote Intro. A 2-4 line summary. Strong sentences! No links.

<video autoplay muted loop controls title="SOME TITLE HERE">
	<source src="https://cdn.directus.io/docs/v9/SOME_URL_HERE" type="video/mp4" />
</video>

<!-- Media demonstrates which feature the page covers. Can be omitted on shorter documents. -->

[[toc]]

:::tip Before you Begin

Please see the [Platform Overview]() Before starting and section. To use the `Z` Module, you will need to understand
`W`, `X`, and `Y`.

:::

:::tip Relevant Pages

This is a non-technical, no-code guide to the `Z` feature. Please note there is also documentation on further
configuration options in [SOME_DOC]() as well as programmatic management via the API.

:::

<!-- Most pages will require some foundational knowledge to understand and have more relevant pages in another documentation section. We put these additional resources upfront as shown above above. -->

## How it Works

<video autoplay muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/SOME_URL_HERE" type="video/mp4" />
</video>

<!-- Video demoing the general feature -->

After the video, we add additional paragraph text to give readers a big-picture overview of what this app can do. This
could be a few lines, or a few paragraphs. Just do whatever is necessary to make the functionality crystal clear to
fresh readers.

## Create an Item

## Create Multiple Items

## View an Item

## Edit an Item

## Delete an Item

<!--
App guide instructions should be ordered: Create, View, Edit, Delete.
-->
```

In certain cases, the structure above may deviate somewhat. For example, [Display Templates](/app/display-templates) are
so easy and simple that separate create, view, edit, and delete sections are not necessary. These are all combined into
`## How it Works`.

### Sectional Structure

Each section in the app guide should be composed with the following flow: title, media, explanatory paragraph(s),
numbered instructions, and ending with the _danger, warning, tip_
[containers](https://v1.vuepress.vuejs.org/guide/markdown.html#custom-containers).

```md
## Create an Item

<!--Use simple, present tense for each section title.-->

<video autoplay muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/SOME_URL_HERE" type="video/mp4" />
</video>

<!-- Feel free to use a video or image, whatever works best. -->

Provide some deeper explanation about this operation upfront. To create an Item, follow these steps:

1. Navigate to the right place in the app and do the first thing.
2. Do the second thing.\
    _Note: You will want to consider this info or option carefully._
3. Do the third thing. You have two options:\
    - Do it this way. - Do it this other way.
4. Do this fourth thing. A menu will appear.
5. Make your choices in the menu.
6. Finish the process and hit <span mi btn>Done</span>.

:::danger

Some tip about dangerous stuff, like permanently deleting data or other vulnerabilities.

:::

:::warning

Tip about something you need to be cautious about.

:::

:::tip

Some useful bonus information, which doesn't fit in main explanations.

:::

<!--
When writing these instructions, be consistent in the verbs being used.
If you say "click", don't switch to "select" later on in another section.
-->
```

<!-- @TODO
## Configuration Structure
## API Structure
## Extensions Structure
## Vue Components Structure
## Contributing Structure
## Directus Cloud Structure
## Self-Hosted Structure
-->
