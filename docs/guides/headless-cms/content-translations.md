---
description: This guide shows how to setup content translations for internationalization (i18n).
tags: []
skill_level:
directus_version: 10.2.0
author_override:
author: Bryant Gillespie
---

# Creating Content Translations

> {{ $frontmatter.description }}

:::tip Author: {{$frontmatter.author}}

**Directus Version:** {{$frontmatter.directus_version}}

:::

Here's what the end result will look like for users when using the Data Studio to manage content.

![A Directus item detail page is shown using the Translations interface. Editable fields for the English and French translations for an article are displayed side-by-side. Fields include Title, Slug, Summary, and Content. ](https://marketing.directus.app/assets/64eee60e-605b-4d2c-809f-83557ed0d5ef.png?key=doc)

## Before You Start

You will need:

- A Directus project. The easiest way to get started with Directus is with our
  [managed Directus Cloud service](https://directus.cloud). You can also self-host Directus.
- Familiarity with [creating collections](/app/data-model/collections#create-a-collection) and
  [creating fields](/app/data-model/fields#create-a-field-standard) inside Directus.

## Create Languages Collection

First, you'll need to create a new collection for all the different languages you'll support.

1. Go to Settings > Data Model and create a new collection for `languages`.

   Here's an overview of the schema for this collection.

   ```md
   languages

   - code (Primary Key Field, Type: Manually entered string )
   - name (Type: String, Inferface: Input)
   - direction (Type: String, Interface: Dropdown, Default Value: ltr)
   ```

   a. When creating the collection, set the primary key to `code` and use the `Manually entered string` type. There's no
   need to add Optional System Fields.

   ![The Creating New Collection form overlay is shown. The active tab is Collection Setup. Name, Singleton, Primary Key Field, and Type fields are shown and editable by the user.](https://marketing.directus.app/assets/e4fe9a63-9cfd-48d9-a1a9-7aedff6279a9.png?key=doc)

   b. Add another field for the `name` of the language.

   c. Add one last field for the `direction` of the text if you're supporting languages that read right to left.

Now you're ready to move on.

## Create Content Collection

Before you can create translations, you need a collection of content to translate.

2. Create a new collection for `articles`.

   Here's an overview of the initial schema for this collection.

   ```md
   articles

   - id (Primary Key Field, Type: uuid )
   - status (Type: String, Interface: Dropdown, Options: ['published','draft','archived'])
   - image (Type: Image)
   - author (Type: M2O Relation, Related Collection: directus_users)
   - date_published (Type: Timestamp, Interface: Datetime)
   ```

   ![Data Model settings screen for the Articles collection is displayed. The following fields are shown: id, status, date_published, author, image.](https://marketing.directus.app/assets/fdeb07d9-d11a-42e9-a39a-14f0a196ecc6.png?key=doc)

   Create the fields above inside the collection.

   They will be shared across all the different translations of each article.

   Do not add the fields to be translated like `title` or `content` or `slug` yet, because those will be stored in a
   seperate collection you will create next.

## Create Content Translations Collection

3. Still within the `articles` collection, create a new field for `translations` using the specially designed
   [Translations interface](/app/data-model/fields/relational#translations). This will create a new junction collection
   inside your project.

   ![The New Field form overlay is shown. The Translations interface is selected. The fields for creating a new Translations relational field are shown: Key, Type, Default Value, Required, Languages Collection, Language Indicator Field, Language Direction Field, Default Language, Use Current User Language.](https://marketing.directus.app/assets/61248b4d-7f6d-47fe-890c-6f9db98642bb.png?key=doc)

   - Use `translations` for the key.
   - For the Languages Collection field, select the `languages` collection you created in Step 1.
   - For Language Indicator Field, you could use the `code` or `name` fields depending on personal preference.
   - For Language Direction Field, choose the `direction` field.
   - You can also select a Default Language by entering the primary key or `code` for that language.

:::tip

By default Directus will name this junction collection `articles_translations` following the convention
`{collection_name}_translations`. If you want more control over the naming of your translation collection and the fields
within, you can choose to Continue in Advanced Field Creation Mode.

:::

## Add The Fields To Be Translated

4. Navigate to the newly created `articles_translations` collection and create the fields for the content you'll
   translate into different languages.

   Here's a sample schema for the collection.

   ```md
   articles_translations

   - title (Type: String, Interface: Input )
   - slug (Type: String, Interface: Input)
   - summary (Type: Text, Inteface: Textarea)
   - content (Type: Text, Inferface: WYSIWYG)
   ```

   ![Data Model settings screen for the Articles Translations collection is displayed. The following fields are shown: id, articles_id, languages_code, title, slug, summary, content.](https://marketing.directus.app/assets/e2ee5c61-3449-40cf-9cd4-24f9edb2ae6a.png?key=doc)

## Test By Creating Content

Everything is now setup to allow you to translate Articles into multiple languages so it's time to test what you've
built.

5. Before you create your first article, you'll need to add a few items to the `languages` collection. Navigate to the
   Content module > Languages collection and add two languages.

   ![The table layout for the Languages collection is shown. There are two items displayed. One for English and one for French.](https://marketing.directus.app/assets/9afe044e-405c-46e7-851f-2a400f3672ea.png?key=doc)

6. In the Articles collection, create a new article and scroll down to the Translations field and start translating your
   content.

   You can show one language at a time or show two languages side by side.

   ![A Directus item detail page is shown using the Translations interface. Editable fields for the English and French translations for an article are displayed side-by-side. Fields include Title, Slug, Summary, and Content. ](https://marketing.directus.app/assets/64eee60e-605b-4d2c-809f-83557ed0d5ef.png?key=doc)

   There is also a progress indicator for the status of each language.

   ![A dropdown menu with a progress indicator for English and French languages are shown. The progress is less than half and shown in red.](https://marketing.directus.app/assets/78a895e9-744e-4d33-9d87-3c5ca4c784e2.png?key=doc)

## Next Steps

Over the course of this guide, you've setup the basics for translating your content within Directus. Nice work!

Next, you would setup translations collections for all the different content collections you'll be translating.

Your Headless CMS is just one side of the equation so don't forget to test the API responses and handle them
appropriately within your frontend.
