# Activity

> Directus stores detailed records of all data changes made via the App and API. This gives a comprehensive
> accountability log of who did what, and when. This also powers the Directus versioning system, which allows storing
> alternate versions/revisions of items.

The Activity Log tracks all events that have occurred within the project. Activity can be accessed in two ways, via the
main [Activity Module](/concepts/application/#activity-log), or within the sidebar of individual
[Item Detail](/concepts/application/#item-detail) pages. The following information is stored for each event's activity
item:

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

Directus can only track events that pass through the platform's middleware. Changes made directly to the database, or by
other external means, are not included.

:::
