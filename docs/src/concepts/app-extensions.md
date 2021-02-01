# App Extensions

> Directus has been architected as completely modular and extensible. There are four keystone component types within the
> App. Out-of-the-box components are configurable, or altogether new components can be created as extensions.

## Modules

Modules are the highest and broadest level of organization within the App. All core functionality within the App (other
than authentication and activity) can be bucketed into one of the following five modules:

- Collections — The primary way to view and interact with database content
- User Directory — A dedicated section for the platform's system Users
- File Library — An aggregate of all files uploaded and managed within the platform
- Documentation — A tailored, in-app portal for the platform's concepts, guides, and reference
- Settings — An Admin-Only section for configuring the project and system settings

In addition to these core modules, custom modules offer a _blank canvas_ for creating altogether new/different
experiences within the App, such as proprietary dashboards, compound datasets, or third-party integrations (eg: a Stripe
Payments Console).

### Relevant Guides

- [Creating a Custom Module](/guides/extensions/modules)

## Layouts

Layouts provide different ways for presenting, browsing, visualizing, or even managing sets of data. Most commonly shown
on Collection Detail pages and contextual modals for item selection. Directus includes several Layout options
out-of-the-box, each with different features and configuration options.

### Table

This tabular layout supports all forms of data, and is therefore the default within the Collections module. It includes
the following features/options:

- Toggle & Reorder Field Columns (Option)
- Row Spacing (Option)
- Manual Ordering
- Column Sort
- Column Resizing
- Select All

### Cards

This tiled layout is ideal for collections that prioritize an image. It is the default for both the
[User Directory](/guides/users) (shows the avatar) and [File Library](/guides/files) (shows asset thumbnail). It
includes the following features/options:

- Image Source (Option)
- Title (Option)
- Subtitle (Option)
- Image Fit (Option)
- Fallback Icon (Option)
- Card Size
- Sort Field & Direction
- Select All

<!-- ### Calendar

This temporal layout is ideal for collections that prioritize a date and/or time. It is the default for the [Activity Page](/concepts/activity-and-versions). It includes the following features/options:

* @TODO

In addition to these core layouts, custom layouts allow for creating more tailored or proprietary ways to experience data within the App, such as charts, seating charts, or Maps. -->

### Relevant Guides

- [Creating a Custom Layout](/guides/extensions/layouts)

## Interfaces

Interfaces provide a multitude of ways to view or interact with field data on
[Item Detail](/concepts/app-overview#item-detail) page forms. Every interface supports a specific subset of field
[types](/reference/field-types) (eg: String), which determines how the data will be stored. For example, the _Text
Input_ interface can manage most types of data, but might not be ideal for dates, where a _Calendar_ interface excels.
Directus includes many Interfaces out-of-the-box:

- Text Input
- @TODO List all core interfaces, or link to an exhaustive reference?

In addition to these core interfaces, custom interfaces allow for creating more tailored or proprietary ways to view or
manage field data, such as bespoke layout builders, skeuomorphic knobs, or relational views for third-party data (eg:
Stripe Credit Card UI).

### Relevant Guides

- [Creating a Custom Interface](/guides/extensions/interfaces)

## Displays

Displays are the smaller, read-only counterpart to Interfaces, defining how a field's data will be displayed inline on
[Item Detail](/concepts/app-overview#item-detail) pages, Modals, and even within Interfaces themselves. For example, you
may have a "Status" field that uses a _Dropdown_ Interface on the Item Detail page, and a _Color Dot_ Display when the
field is referenced throughout the rest of the App. Directus includes many Displays out-of-the-box:

- Raw
- Formatted Value
- @TODO List all core interfaces, or link to an exhaustive reference?

In addition to these core displays, custom displays allow for creating customized ways to view or represent field data,
such as progress indicators, relational data tooltips, or specific formatting options.

### Relevant Guides

- [Creating a Custom Display](/guides/extensions/displays)
