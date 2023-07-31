---
description:
  Directus supports internationalization across the entire App. Many languages are currently supported, with more being
  added all the time.
readTime: 2 min read
---

# App Translations

> The platform supports internationalization across the entire App. Many languages are currently supported, with more
> being added all the time. Anyone can add or refine any languages through the integration with Crowdin.

## Crowdin

Our [Crowdin](https://locales.directus.io) page provides an external interface for managing all of the different
language translations for the App. You can update and extend existing languages, or request a new language be added.

## Working with Existing Languages

1. Navigate to [Crowdin](https://locales.directus.io)
2. Click on the desired language
3. Click **Translate All** in the header
4. Log in to Crowdin, or register an account as needed
5. Select a source string using the left-hand navigation
6. Add or edit the translation in the lower text area
7. Click "SAVE" below the translation

It is important to keep the character length approximately the same as the source string (English) to avoid truncation
or a drastically different wrapping. For example, some text translations will go in a smaller button with limited space
for text and no ability to wrap.

Crowdin provides useful TM and MT suggestions, however you should always confirm that these are context appropriate, as
they may not accurately map to the source meaning.

If you feel you do not have enough information on how this string is used, you can always ask for additional context
using the "Comment" section.

## Releasing New Translations

As soon as a translation is edited on Crowdin, a pull request is created by Crowdin in our repo, which contains the
corresponding changes.

This pull request is usually merged into main before publishing a new release.

::: warning Translations on GitHub

Editing translations directly in the GitHub repo is not recommended, as these changes will be overwritten by Crowdin
again (unless we do a manual sync).

:::

## Requesting a New Language

To add a new language to the Crowdin service, you can make a request via Crowdin's **Discussions** section, or reach out
to a Core Team member via [Discord](https://directus.chat).
