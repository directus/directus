# Field

> Description of a Field.

- **Required** — Toggles if a value for the Field is required.
  - Empty strings (`''`) and `NULL` are **not** accepted as a valid value
  - `0` and `false` are accepted as a valid value
  - Default values are accepted as a valid value
  - Permission Presets are accepted as a valid value
- **Readonly** — (App Only) Sets the field to be disabled.
- **Hidden** — (App Only) Hides the field in the App form.
  - The field is still available in filters and Layout options.
- **Note** — (App Only) Displayed below the field in the App form, providing a helpful comment for App users. This note
  supports markdown.
- **Field Name Translations** — (App Only) While the field key can not be changed (as of now), this option allows
  translating the field name into different languages. By default, the platform uses the
  [Title Formatter](/getting-started/glossary/#title-formatter) to display field keys as human readable names, but you
  can also use translations to explicitly rename more technical column keys.
