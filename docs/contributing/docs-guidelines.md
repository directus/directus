# Miscellaneous Questions

- Glossaries
- Linking Things
- Defining a "Feature" -> The document's "topic" -> "Scoping a doc".
- Definining the extent of a tutorial/process.
  - Insights' "How it Works" combines CRUD into one operation.
  - Cloud/Content/others CRUD operations are separate.
- Before you Begin has a super simple link to a "getting started" section which is a pre-requisite to reading all
  documentation. It should be a 30-90 minute read.

# Documentation Guidelines

This is a single source of truth for Directus Documentation to help core team members and other contributors keep prose,
styling, content scope/structure, and media assets uniform and in-sync.

## Document Types

1. No-code technical.
2. No-code Informational/Expository. (e.g. glossaries, overviews, etc.)
3. Code-based technical reference.
4. Code-based tutorial.
5. Instructional/Educational (for the future).

## No-Code Technical Structure

Sometimes no-code technical documents take a single page, sometimes they take multiple pages.

### Single Page Docs

As the name implies, these are standalone documents.

- `# Page Title`
- Blockquote Intro: 2-4 lines. Strong sentence.
- `[[toc]]`
- Header Media
- Intro paragraphs and tips
- `:::tip Before you Begin`
- `## Title`: (Update | Updating) an Item??
  - Titles -> keep them simple, avoid changes
  - Titles -> Don’t wanna go beyond H3s
  - `:::danger, warning, tip`

### Nested Page Docs

- Blockquote Intro: 2-4 lines. Strong sentence.
- `[[toc]]`
- Header Media
- Intro paragraphs and tips
- `:::tip Before you Begin`
- `## Child Page Overview`
  - Intro Paragaph
  - `Learn More` Link to Child page
  - `:::danger, warning, tip`

**Child Pages**

- Blockquote Intro: 2-4 lines. Strong sentence.
- `[[toc]]`
- `## CRUD and Other Operations`
  - Media
  - Intro to Operation
  - Steps to Operation
  - `:::danger, warning, tip`

## Section Structure

There are some times when it may be better to break the flow on section structures. Some actions require a lengthy
explanation which is best fit after the steps are given.

- `## Title`
- Media
- intro sentence or paragraph
- Directions (1, 2, 3, 4...)
- :::tips

## Language, Punctuation and Styling

- Text Widows
- Clicked vs Selected vs Access etc.
- Blocks must be in this order: danger, warning, tip
- Leave Title on Dangers and Warnings blank, defaults to WARNING
- Use word when writing integer less than 10...\
- Should we draw from
  [APA](https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/general_format.html)
  or [IEEE](https://owl.purdue.edu/owl/research_and_citation/ieee_style/ieee_general_format.html) as a foundation

- Deep linking: Never change Headers once finalized.\
  Perhaps we can use a broken link finder? Haven't looked into this.
- Comma lists vs slashes?
- The long hyphen `—` is used after key terms `shift + option + "-"` on a mac.
- Period at end of `ul` and `ol` items.
- Capitalization of Directus Terms.

### Bullet Point Topics

- **Team Members** — [View, invite and remove](/cloud/teams) other Team Members or leave a Team yourself. TURNS TO
- [Team Members](/cloud/teams) — View, invite and remove other Team Members or leave a Team yourself.

## Media

- Use a clean browser, with no add-ons, extra tabs, or widgets visible.
- Use the Company logo for an avatar (on google chrome) Example Content Guidelines.\
- Semi-realistic examples.
- Business professional language.
- Shouldn't take over 10 min to make a screenshot or video beginning-to-end.
- No scroll-bars.
- Should we make each image and video a modal/lightbox?

### Images

Fill screen with window.\
Take screencap of window.\

Add images of acceptable and unacceptable screencaps. Use squoosh.app to convert to webp

### Videos

- Screen record the window.
- Optimize file with Handbrake.

## Useful Links

**[Squoosh](squoosh.app)** — A webapp to convert images to `.webp`. Also has a
[batch-convert CLI Tool](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli).

**[Handbrake](https://handbrake.fr/)** — Makes video file 10-20x smaller with no reduction in quality. Use on _all_
videos.

**[Material Design Icons](https://fonts.google.com/icons)** — The icons we use in Directus.
