# Displays <small></small>

> Displays are the smaller, read-only counterpart to Interfaces, defining how a field's data will be displayed inline
> throughout the App.

For example, you may have a "Status" field that uses a _Dropdown_ Interface on the Item Detail page, and a smaller
_Badge_ Display when the field is referenced throughout the rest of the App. Directus includes many Displays
out-of-the-box, below are the some key examples:

- **Raw** — The exact value, straight from the API
- **Formatted Value** — Provides options for string formatting
- **Boolean** — Customizable True/False icons
- **Color** — A color swatch preview
- **DateTime** — Formatted or relative datetimes
- **Image** — Thumbnail previews
- **Labels** — Small, custom colored badges
- **Rating** — Customizable stars
- **Related Values** — Displays relational display titles
- **User** — Avatar and name of a system user

In addition to the included core displays, custom displays allow for creating new and/or proprietary ways to view or
represent field data. For example, you could create progress indicators, tooltips for relational data, specific
formatting styles, or anything else.

### Relevant Guides

- [Creating a Custom Display](/guides/displays)
