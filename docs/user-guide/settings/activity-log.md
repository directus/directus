---
description:
  This module provides a collective timeline of all actions taken within the project. These detailed records allow for
  auditing user activity and enforcing accountability.
readTime: 2 min read
---

# Activity Log

> This module provides a collective timeline of all _data-changing_ actions taken within your project. These detailed
> records help you audit user activity and enforce accountability.

::: tip Before You Begin

We recommend you try the [Quickstart Guide](/getting-started/quickstart) to get an overview of the platform.

:::

::: tip Learn More

To manage the Activity Log programmatically, please see our guide on the [Activity Log API](/reference/system/activity).

:::

## Overview

<video title="Activity Log Overview" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/activity-log/activity-log-20220816/activity-log-20220816A.mp4" type="video/mp4" />
</video>

The Activity Log is the only Module in Directus Core that is not found in the
[Module Bar](/user-guide/overview/data-studio-app#_1-module-bar). Instead, it is accessed via the notifications tray of
the [Sidebar](/user-guide/overview/data-studio-app#_4-sidebar). The Activity Log page has the same features and
functionality as the [Collection Page](/user-guide/content-module/content/collections).

::: warning External Changes

The platform can only track the events which actually pass through it. Therefore, any changes made to the database
_directly_ are not tracked.

:::

::: tip

You can also view and revert the activity of _specific items_ under **Item Page > Sidebar > Revisions**. To learn more,
please see [Revert an Item](/user-guide/content-module/content/items#revert-an-item).

:::

## View an Activity Log Item

![Activity Log Default Fields](https://cdn.directus.io/docs/v9/configuration/activity-log/activity-log-20220816/activity-log-default-fields-20220816A.webp)

Click any item in the Activity Log and a side drawer will open, displaying its logged details. The following information
is stored for each item.

- **User** — The user that performed the action.
- **Action** — The specific action taken _(e.g., Create, Update, Delete, Comment, or Login)_.
- **TimeStamp** — The timestamp of when the action was performed.
- **IP Address** — The IP address of the device from which the action was performed.
- **User Agent** — The description of the browser that was used to perform the action.
- **Collection** — The Collection affected by the action.
- **Item** — The ID of the item affected.
- **Comment** — The comment left by the user _(when applicable)_.

## Filter by Activity

<video title="Filter by Activity" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/activity-log/activity-log-20220816/filter-by-activity-20220817A.mp4" type="video/mp4" />
</video>

In addition to the filter and display functionality inherited from the
[Collection Page](/user-guide/content-module/content/collections), you can also filter items by activity from the
Navigation Bar.

## Modify an Activity

<video title="Filter by Activity" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/activity-log/activity-log-20220816/modify-an-activity-20220817A.mp4" type="video/mp4" />
</video>

To ensure proper accountability, system collections are **read only** by design. However, users with an Admin role have
the ability to reopen, view, and modify an item's values in activities from non-system collections (where the name does
not begin with `directus_`). To view or modify an activity, follow these steps.

1. Navigate to the Activity Log page.
2. Click the desired item. A drawer will open, displaying its activity log.
3. Click <span mi btn>launch</span> to reopen the item page and make modifications as desired.
4. In the page header, click <span mi btn>check</span> to confirm.

Once confirmed, any updates to an item will be logged as a new activity.
