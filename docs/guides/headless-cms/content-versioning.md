---
description: This guide covers the process of enabling and utilizing Content Versioning in Directus.
contributors: Esther Agbaje
---

# Implementing Content Versioning

> {{ $frontmatter.description }}

## Introduction

Content Versioning allows teams to create and manage different versions of their content. There are several reasons to
use Content Versioning, including drafting content without publishing it, and more ways to collaborate with others.

## Concepts

1. **Version:** A version is a snapshot of the differences between the original item and the created version. Each
   version represents a set of future changes to be applied to the item.
2. **Main:** The main version is the original version of a piece of content that has been created and published. It is
   the default version that is displayed to users. The main version is the "source of truth" for all other versions.
3. **Promote:** Promoting a version means to make it the new main version. When a new version is promoted, it becomes
   the main version that is displayed to users, and it replaces the previous main version.

## Setting Up Content Versioning

To enable Content Versioning for a collection in Directus, follow these steps:

1. Log in to your Directus instance.
2. Navigate to **Settings** > **Data Model**.
3. Select the collection that you want to enable Content Versioning for.
4. Scroll down to the Content Versioning section.
5. Toggle "**Enable Versions**" and save your data model.

## Creating a New Version

With Content Versioning set up, you can now create a new version of your content:

1. Open an item within your desired collection.
2. At the top of the item view, you will notice a dropdown with the main Content Version displayed as "**main**".
3. From the dropdown, click "**Create Version**".
4. Provide a **key** and a **name** for the new version. For instance, you can use "draft" as the key and "My Draft" as
   the name.
5. Click "**Save**" to create the new version.

::: tip Version Source

All new versions originate from the main version. This implies that the main version acts as the single source of truth
for other versions.

:::

## Making Changes to a Version

After creating a new version, you can make changes without affecting the main version:

1. Open the item in the newly created version e.g. "**My Draft**" version.
2. Make the desired edits to the item's content.
3. Save the changes.
4. Notice that the main version remains unaffected, while the changes are reflected only in the "**My Draft**" version.

## Reviewing and Promoting a Version

Once you are satisfied with the changes made in a version and want to incorporate them into the main version, you can
promote the version. Follow these steps to promote a version:

1. Open the version you want to promote.
2. Select the "**Promote Version**" option from the dropdown.
3. In the "**Changes**" tab, you can review all the changes made in the version and decide which changes to accept or
   reject.
4. Switch to the "**Preview**" tab to see a preview of the changes you are about to promote.
5. After reviewing the changes, confirm the promotion by clicking "**Save**".

After promoting a version, you can choose to keep or delete the version.

::: tip Programmatically Implement Content Versioning

You have the option to integrate Content Versioning through the API. To learn how to accomplish this, please refer to
our [API reference documentation](/reference/system/versions).

:::

## Revisions and Content Versioning

Under the hood, content versions are stored in the `directus_revisions` collection. In bigger projects this collection
can get large.

Some Directus users combat this by periodically purging some or all data in this collection. Be aware that this could
unintentionally purge content versions, so purging logic may have to be updated.

## Next Steps

You have now set up Content Versioning for a collection and learned how to promote a version to the main version. Here
are some additional tips when using this feature:

- Name versions descriptively so it's clear what changes each version contains.
- To prevent conflicts, ensure no modifications are made to the main version at the time a new version is created.
- Access the version history by referring the "**Revisions**" sidebar.
- Rollback to a previous main version by using the existing revert feature.
- Configure roles and permissions as needed to the `directus_versions` system collection.
