# Activity & Versions

> Directus stores detailed records of all changes made to data through the App and API. This gives a comprehensive accountability log of who did what, and when. This also powers the Directus versioning system, which allows storing alternate versions/revisions of items.

## Activity

This is a log of all events that have occured within the project. Activity can be accessed in two ways, via the main [Activity Module](#), or within the sidebar of individual [Item Detail](#) pages. The following information is stored for each event's activity item:

* Action
* User
* Datetime
* IP Address
* User Agent
* Collection
* Item
* Comment (when applicable)

::: Readonly
For proper accountability, activity records are readonly. Administrators should avoid changing, deleting, or truncating this data.
:::

:::warning External Events
Directus can only track events that pass through the platform's middleware. Changes made directly to the database, or by other external means, are not included in the activity log.
:::

## Versions

Every change made to items in Directus are also stored as a versioned snapshot. This additional data is also linked to the specific Activity event which created it. Below are the two key pieces of information stored for each version:

* Data — A full snapshot of the item _after_ the event
* Delta — The specific field data changed by this event

::: Customizing Version Data
Since versions store a full data snapshot and delta, the `directus_revisions` collection can quickly grow quite large, increasing database size and potentially decreasing performance. To remedy this, Directus allows [configuring version scope](#) per collection to set the exact field data saved.
:::

::: Creating Detached Versions
You can also create a new version for an item without saving the data to the parent item itself. This allows you to "stage" changes to an item that may already be live/published.
:::

### Relevant Guides

* [Reverting an Item](#)
* [Changing an Item's Version](#)
* [Creating Detached Versions](#)
