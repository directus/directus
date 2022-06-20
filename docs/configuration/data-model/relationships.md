# Relationships

## Create a Translated Multilingual Field

While you could create individual fields for each translation, such as `title_english`, `title_german`, `title_french`,
and so on, this is not easily extensible, and creates a less than ideal form layout. Instead, you can use the Directus
_relational_ [Translations O2M](/configuration/relationships/#translations-o2m) interface. This uses a separate
collection to store an endless number of translations, and a separate collection of languages that can easily be added
to without having to change the schema.

Let's take a look at a basic example for "Articles":

- **`articles` Collection**
  - `id` — (Primary Key)
  - `author` — Field that is not translated
  - `date_published` — Field that is not translated
  - `translations` — A O2M relational field to `article_translations`
- **`article_translations` Collection**
  - `id` — (Primary Key)
  - `article` — The key of the article this belongs to
  - `language` — The language key of this translation
  - `title` — The translated Article Title
  - `text` — The translated Article Text
- **`languages` Collection**
  - `language_code` — (Primary Key) eg: "en-US"
  - `name` — The language name, eg: "English"

As you can see above, you add **non-translated** fields, such as the `author` and `publish_date`, to the parent
collection. Any **multilingual** fields, such as Title or Text, should be added directly to the Translation Collection.
You can not simply drag or shift fields from the parent to translations, they must be _created_ in the correct
collection.

::: tip Translating Parent Fields

To make an existing parent field translatable, you can choose "Duplicate Field" from its context menu, move it to the
translation collection, and then delete the parent field. However, be aware that this does **not** maintain any existing
field values in the process.

:::
