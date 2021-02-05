# Accountability

> Directus stores detailed records of all data changes made via the App and API. This gives a comprehensive accountability log of who did what, and when. This also powers the Directus versioning system, which allows storing alternate versions/revisions of items.

## Activity Logs

This is a log of all events that have occurred within the project. Activity can be accessed in two ways, via the main
[Activity Module](/concepts/app-overview#activity-history), or within the sidebar of individual
[Item Detail](/concepts/app-overview#item-detail) pages. The following information is stored for each event's activity item:

## Activity Fields

- **User** — The Directus user that performed the action
- **Action** — The specific action taken, eg: Create, Update, Delete, Authenticate
- **TimeStamp** — The timestamp of when the action was performed
- **IP Address** — The IP address of the device from which the action was performed
- **User Agent** — The description of the browser that was used to perform the action
- **Collection** — The Collection affected by the action
- **Item** — The item (within the above Collection) affected by the action
- **Comment** — When applicable; the comment left by the user

::: tip Readonly

For proper accountability, activity records are readonly. Administrators should avoid changing, deleting, or truncating
this data.

:::

::: warning External Events

Directus can only track events that pass through the platform's middleware. Changes made directly to the database, or by other external means, are not included.

:::

#### Relevant Concepts

- [Activity History](/concepts/application/#activity-history)

## Versions

Every change made to items in Directus are also stored as a versioned snapshot. This additional data is also linked to
the specific [Activity](#activity) event which created it. Below are the two key pieces of information stored for each version:

- **Data** — A full snapshot of the item _after_ the event
- **Delta** — The specific field data changed by this event

<!-- @TODO ::: tip Customizing Version Data
Since versions store a full data snapshot and delta, the
`directus_revisions` collection can quickly grow quite large, increasing database size and
potentially decreasing performance. To remedy this, Directus allows
[configuring version scope](/concepts/app-overview) per collection to set the exact field data
saved.
::: -->

::: tip Creating Detached Versions

You can also create a new version for an item without saving the data to the parent item itself. This allows you to
"stage" changes to an item that may already be live/published.

:::

#### Relevant Guides

- [Reverting an Item](/guides/items#reverting-an-item)
- [Changing an Item's Version](/guides/items)
