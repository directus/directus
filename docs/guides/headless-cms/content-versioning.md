---
description: This guide covers the process of enabling and utilizing content versioning in Directus.

directus_version: 10.7.0
author: Esther Agbaje
---

# Implementing Content Versioning

> {{ $frontmatter.description }}

## Introduction

Content versioning allows you to create and manage different versions of your content. There are several reasons to use
content versioning, such as: To keep track of changes to your content over time To collaborate seamlessly with others To
restore previous versions of your content if necessary

Content versioning follows a git-like workflow: you have a main version of an item and then can create versions, add
content to those versions, and finally incorporate (or 'merge') those changes back into the main version.

## Prerequisites

Before you begin, make sure you have the following:

- Access to a Directus instance
- Admin privileges to enable content versioning for a collection

## Setting up Content Versioning for a Collection

To enable content versioning for a collection in Directus, follow these steps:

1. Log in to your Directus instance
2. Go to Settings > Data Model
3. Open an existing one that you want to enable content versioning for.
4. Scroll down to the Content Versioning section.
5. Check the Enable Branches option.
6. Save your data model.

Once you've enabled content versioning, you’re now ready to manage different versions of your content.

## Creating a New Version

Once content versioning is enabled for a collection, you can create new versions of its items. Follow these steps to
create a new version:

1. Open an item within the collection, such as an article collection.
2. At the top of the item view, you will see the main content branch displayed as "main".
3. Click on the "Create version" button.
4. Provide a key and a name for the new version. For example, you can use "draft" as the key and "my draft" as the name.
5. Click "Save" to create the new version.

## Making Edits and Viewing Changes in a Version

After creating a new version, you can make edits and view the changes without affecting the main version. Here's how:

1. Open the item in the newly created version (e.g., "my draft").
2. Make the desired edits to the item's content.
3. Save the changes.
4. Notice that the main version remains unaffected, while the changes are reflected in the "my draft" version.

## Reviewing and Promoting a Version

Once you are satisfied with the changes made in a version and want to incorporate them into the main version, you can
promote the version. Follow these steps to promote a version:

1. Open the version you want to promote (e.g., "my draft").
2. Select the "Promote Version" option.
3. In the "Changes" tab, you can review all the changes made in the version and decide which changes to accept or
   reject.
4. Switch to the "Preview" tab to see a preview of the changes you are about to promote.
5. After reviewing the changes, confirm the promotion.

After promoting a version, you can choose to keep or delete the version.

::: tip Programmatically Implement Content Versioning

You have the option to integrate content versioning through the API. To learn how to accomplish this, please refer to
our API reference documentation.

:::

## Next Steps

Over the course of this guide, you’ve set up content versioning for your collection. Here are some additional tips when
using this feature:

- Create Multiple Versions: Experiment with content by creating numerous versions of an item to test new concepts
  independently.
- Compare Versions: Directus allows side-by-side visual diffing of any two selected versions.
- Configure Automated Workflows: Leverage webhooks to automatically promote versions based on defined milestones.
