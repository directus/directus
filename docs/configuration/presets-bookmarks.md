# Collection Presets

> Presets store the state of a Collection Detail page. They can be used to set layout defaults or define bookmarks to
> specific datasets. [Learn more about Presets](/getting-started/glossary/#presets).

## Creating a Preset

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Presets & Bookmarks**
2. Click <span mi btn>add</span> in the header
3. Complete the **other preset form fields** outlined below

- **Collection** — The collection of this preset; supports any project collection, Directus Files, or Directus Users
- **Scope** — The users that will have access to this preset, either Global, a specific Role, or an individual User
- **Layout** — The collection detail's layout this preset applies to
- **Name** — If left blank, this preset will act as a Default for the collection/layout; if given a name, it will be
  shown as a bookmark

After you have completed the form, the layout preview will be populated with live data. **You can now tailor the layout
as desired by updating the preview or the filter component in the page sidebar.**

Each preset saves all of the information needed to recreate a view of the collection/layout, including:

- **Collection** — The collection of the preset
- **Layout** — The Layout the preset applies to
- **Layout Query** — Order direction, order field, pagination, etc
- **Layout Options** — The configuration of all layout options
- **Search** — Any full-text search query applied
- **Filters** — Any advanced filters applied
- **User** — Optional; scopes to a specific user
- **Role** — Optional; scopes to a specific role
- **Bookmark Name** — Optional; determines if the preset is a bookmark

::: tip Defaults vs Bookmarks

It's important to be aware of the difference between a collection's _defaults_ and its _bookmarks_, both of which are
configured by presets. A _default_ is how a user will initially view the collection detail without any further
customization, while a _bookmark_ is a named dataset that can be recalled at any point via the
[navigation bar](/app/overview/#_2-navigation-bar).

:::

::: tip System Defaults

You can also adjust the defaults and bookmarks for the Directus Activity, Directus Files, and Directus Users
collections.

:::

::: tip Order of Defaults

Multiple defaults can be configured for a user, either for different layouts of even the same layout. In this case, the
preset priority is: User, then Role, then Global.

:::

## Deleting a Preset

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Presets & Bookmarks
   <span mi icon dark>chevron_right</span> [Preset]**
2. Click <span mi btn dngr>delete</span> in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::
