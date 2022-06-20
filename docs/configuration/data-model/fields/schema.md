# Schema

> This pane controls the technical details of the field's database column.

- **Key** — (Required) The database column name and field's API key. The key must be unique within its parent
  Collection. As of now, all keys are sanitized: lowercased, alphanumeric, and with spaces removed. Keys can not be
  changed once created, however you can use [Field Name Translations](/configuration/data-model/#field) to override how
  it's displayed in the App.
- **Type** — (Required) How the data is saved to the database; See
  [Directus Data Type Superset](/getting-started/glossary/#data-type-superset). This dropdown may be limited or even
  disabled based on your chosen Field category.
- **Length** — (Only for certain types) For String types this determines the number of characters that can be stored in
  the database. For Float and Decimal types, this control becomes **Precision & Scale**.
- **On Create** — (Only for certain types) For some data types, this option allows you to control what value is saved
  when an item is created. These values are fallbacks and can be overridden by the App/API. For example, the Timestamp
  type allows you to "Save Current Date/Time".
- **On Update** — (Only for certain types) For some data types, this option allows you to control what value is saved
  when an item is updated. These values are fallbacks and can be overridden by the App/API. For example, the UUID type
  allows you to "Save Current User ID".
- **Default Value** — This is the initial value shown for a field when creating an item in the App. If creating an item
  via the API, this is the fallback value saved to the database if a field value is not submitted.
- **Allow NULL** — Toggles if the database column is nullable. When disabled, a `NULL` value can not be saved to the
  field's column.
- **Unique** — Toggles if the database column's values must all be unique.

::: danger Immutable Keys

As of now, the key cannot be modified after the field has been created.

:::

::: warning Composite Keys

At this time, Directus does not support composite keys.

:::
