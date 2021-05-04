# Revisions & Versioning

> Revisions are created when an _original_ Item is updated. These alternate versions are tracked so that previous states can be recovered, or potential edits can be staged.

Every change made to items in Directus is stored as a complete versioned snapshot. The Revisions system is tightly coupled to the Activity Logs system, with each revision being linked to
the specific [Activity](/concepts/application/#activity-log) event which created it.

## Revision Fields

- **Data** — A full snapshot of the item _after_ the event
- **Delta** — The specific field data changed by this event
- **Parent** — If this revision was created via a nested relationship

<!-- @TODO ::: tip Customizing Version Data
Since versions store a full data snapshot and delta, the
`directus_revisions` collection can quickly grow quite large, increasing database size and
potentially decreasing performance. To remedy this, Directus allows
[configuring version scope](/concepts/app-overview) per collection to set the exact field data
saved.
:::

::: tip Creating Detached Versions

You can also create a new version for an item without saving the data to the parent item itself. This allows you to "stage" changes to an item that may already be live/published.

:::

-->

#### Relevant Guides

- [Reverting an Item](/guides/items/#reverting-an-item)
