# Permissions

> Permissions are attached directly to a Role, and define what data that Role's Users can create, read, update, and
> delete within the platform.

Directus includes an extremely granular, filter-based permissions system for controlling access. There are several
layers to this access control, including:

- **Collection** — The Collection scope of this permission
- **Action** — Create, Read, Update, or Delete
- **Item Permissions** — Filters actionable Items using [Filter Rules](/reference/filter-rules/)
- **Field Permissions** — Toggles which fields can be accessed
- **Validation** — Filters Item values using [Filter Rules](/reference/filter-rules/)
- **Presets** — Controls the default values for the action
- **Limit** — Sets a maximum number of items that are actionable

There are also other access control features that are tied directly to the Role. These include:

- **IP Access** — Restricts user access based on IP Address
- **App Access** — Restricts user access to the App
- **Admin Access** — Enables Settings and unrestricted user access

### Example

You could set the permissions such that a user can only **Update** (Action) the **Title, Body, Date Published, and
Category** (Field Permissions) within **Articles** (Collection) that **they created and are still unpublished** (Item
Permissions) **one item at a time** (Limit) if they are **currently at the NYC office** (IP Access). Additionally, the
**default Category will be "Opinon"** (Preset), and the **Date Published must be in the future** (Validation).

And this is actually just a _simple_ example. Permissions and Validation support a comprehensive list of
[Filter Operators](/reference/filter-rules/#filter-operators),
[Relational Filtering](/reference/filter-rules/#filter-relational),
[Logical Operators](/reference/filter-rules/#logical-operators), and
[Dynamic Variables](/reference/filter-rules/#dynamic-variables).

#### Relevant Guides

- [Configuring Role Permissions](/guides/permissions/#configuring-role-permissions)
- [Configuring System Permissions](/guides/permissions/#configuring-system-permissions)
