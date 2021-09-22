# Fields

> Fields are a specific type of value within a Collection, storing the data of your item's content. Each field
> represents a **column** in your database.

For example, an `articles` collection might have `title`, `body`, `author`, and `date_published` fields. Directus
automatically uses a built-in title formatter to display your database column names prettified, and you can use
[schema translations](/concepts/translations/#schema-translations) to completely rename them if needed.

Fields also mirror other characteristics from their associated column, including its `type`, `default`, `length`,
`allow_null`, etc.

::: tip Relational Fields

Fields that reference other items (in the same collection or different) are called
[relational fields](/concepts/relationships/). Linking or connecting data relationally is an immensely powerful feature
of relational databases and SQL queries.

:::

::: tip Aliases

Not all fields in Directus map directly to an actual database column within their table — these are called "alias"
fields. For example, certain relational fields, like [One-to-Many (O2M)](/concepts/relationships/#one-to-many-o2m) and
[Many-to-Many (M2M)](/concepts/relationships/#many-to-many-m2m), represent data that is stored in _other_ tables. Then
there are Presentation Fields that don't save data at all, such as dividers and action buttons.

:::

#### Relevant Guides

- [Creating a Field](/guides/fields/#creating-a-field)
- [Duplicating Fields](/guides/fields/#duplicating-a-field)
- [Adjusting Field Layout](/guides/fields/#adjusting-field-layout)
- [Deleting Fields](/guides/fields/#deleting-a-field)
