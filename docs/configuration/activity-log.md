# Activity Log

> This module provides a collective timeline of all actions taken within the project. These detailed records allow for
> auditing user activity and enforcing accountability.

The Activity Log is the only module that is not found in the module bar. Instead, it is accessed via the notifications
tray of the [Sidebar](/app/overview/#_4-sidebar). This page has the same features and configuration as
[Collection Page](/app/content-collections/). It's also worth noting that the activity of a _specific_ item is available
via the Revisions sidebar of its individual [Item Page](/app/content-items/).

For proper accountability, activity items are **readonly** by design, though administrators may have access to make
certain updates. The following information is stored for each event's activity item:

- **User** — The platform user that performed the action
- **Action** — The specific action taken, eg: Create, Update, Delete, Authenticate
- **TimeStamp** — The timestamp of when the action was performed
- **IP Address** — The IP address of the device from which the action was performed
- **User Agent** — The description of the browser that was used to perform the action
- **Collection** — The Collection affected by the action
- **Item** — The item (within the above Collection) affected by the action
- **Comment** — When applicable; the comment left by the user

::: warning External Changes

The platform can only track the events which actually pass through it. Therefore, changes made to the database
_directly_ are not tracked.

:::
