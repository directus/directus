# Collections

> Each Collection contains some number of fields, and is a container for a specific grouping of Items. Each collection
> represents a **table** in your database.

Directus automatically uses a built-in title formatter to display your database table names prettified, however you can
use [schema translations](/concepts/translations/#schema-translations) to completely rename them if needed.

Collections can be organized in any way that is appropriate for your project. You can architect them platform-specific
(eg: _pages_ of a website), or in a more platform-agnostic way (eg: raw _customers_ of your business). While there's no
right or wrong way to structure your data-model, we recommend keeping your data as agnostic as possible so it is easier
to repurpose in the future. **In short, learn to see your data as its own asset — not only through the lens of your
immediate project needs**.

The only requirement of a collection is that it must contain a **Primary Key** field. This field stores a unique value
that is used to reference the Collection's items throughout the database/platform.

#### Relevant Guides

- [Creating a Collection](/guides/collections/#creating-a-collection)
- [Configuring a Collection](/guides/collections/#configuring-a-collection)
- [Deleting a Collection](/guides/collections/#deleting-a-collection)
- [Adjusting a Collection Layout](/guides/collections/#adjusting-a-collection-layout)

## Collection Presets & Bookmarks

Presets store the exact state of a [collection detail](/concepts/application/#collection-detail) page. They are used to
set layout defaults for a user, or to define bookmarks that can be used to quickly recall specific datasets. Each preset
stores the following information:

- **Collection** — The collection of the preset
- **Layout** — The Layout the preset applies to
- **Layout Query** — Order direction, order field, pagination, etc
- **Layout Options** — The configuration of all layout options
- **Search** — Any fulltext search query applied
- **Filters** — Any advanced fitlers applied
- **User** — Optional; scopes to a specific user
- **Role** — Optional; scopes to a specific role
- **Bookmark Name** — Optional; determines if the preset is a bookmark

#### Relevant Guides

- [Creating a Preset](/guides/presets/#creating-a-preset)
- [Deleting a Preset](/guides/presets/#deleting-a-preset)
