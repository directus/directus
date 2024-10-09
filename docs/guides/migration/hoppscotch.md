---
description: Learn how to migrate your data model to a new Directus project using Hoppscotch.
directus_version: 9.23.0
author: Kevin Lewis
---

# Migrate Your Data Model with Hoppscotch

<GuideMeta />

## Explanation

Directus' schema migration endpoints allow users to retrieve a project's data model and apply changes to another
project.

This is useful if you make changes to a data model in a development project and need to apply them to a production
project, or to move from a self-hosted project to Directus Cloud.

[Hoppscotch](https://hoppscotch.io/) is an open source API explorer. It is used in this recipe to make requests to your
Directus project's API without writing code.

## How-To Guide

::: tip Permissions

You must be an admin user to use these endpoints and follow this guide.

:::

You should have two Directus projects - this guide will refer to them as the "source" and the "target". Before starting,
make sure you have a static access token for both projects.

### Retrieve Data Model Snapshot From Source Project

![Screenshot of Hoppscotch annotated with numbers associated with the below points.](https://cdn.directus.io/docs/v9/cookbook/migration-hoppscotch/snapshot.webp)

1. Make sure `GET` is selected in the method dropdown.
2. In the URL field, enter your source Directus project URL followed by `/schema/snapshot`.
3. In the Parameters tab, set a query parameter called `access_token` with the access token for your source project.
4. Click the **Send** button to send the request.
5. Copy the JSON response with your data model snapshot.

### Retrieve Data Model Diff

![Screenshot of Hoppscotch annotated with numbers associated with the below points.](https://cdn.directus.io/docs/v9/cookbook/migration-hoppscotch/diff.webp)

This section will create a "diff" that describes all differences between your source and target project's data models.

1. Make sure `POST` is selected in the method dropdown.
2. In the URL field, enter your target Directus project URL followed by `/schema/diff`.
3. In the Parameters tab, set a query parameter called `access_token` with the access token for your target project.
4. In the Body tab, set the Content Type to `application/json` and paste the JSON response from the snapshot. You must
   only paste the contents of the `data` property.
5. Click the **Send** button to send the request.
6. Copy the JSON response with your data model diff.

### Apply Diff To Target Project

![Screenshot of Hoppscotch annotated with numbers associated with the below points.](https://cdn.directus.io/docs/v9/cookbook/migration-hoppscotch/apply.webp)

1. Make sure `POST` is selected in the method dropdown.
2. In the URL field, enter your target Directus project URL followed by `/schema/apply`.
3. In the Parameters tab, set a query parameter called `access_token` with the access token for your target project.
4. In the Body tab, set the Content Type to `application/json` and paste the JSON response from the diff. You must only
   paste the contents of the `data` property.
5. Click the **Send** button to send the request.
6. Note the response status of 204 - which indicates a successful data model migration.

## Final Tips

The diff endpoint does not allow different Directus versions and database vendors by default. This is to avoid any
unintentional diffs from being generated. You can opt in to bypass these checks by adding a second query parameter
called `force` with the value of `true`.

The hash property in the diff is based on the target instance's schema and version. It is used to safeguard against
changes that may happen after the current diff was generated which can potentially incur unexpected side effects when
applying the diffs without this safeguard. In case the schema has been changed in the meantime, the diff must be
regenerated.
