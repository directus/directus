# Relationships

> Relationships are a crucial part of any relational database. Directus supports all standard relationship types, as
> well as a few more of its own _compound_ types, which are custom-tailored to make certain _common but complex_ tasks a
> breeze.

::: tip Before You Begin

Regardless of the relationship you want to configure, we recommend you read every section of this document, in order, at
least once. This is because you must understand how M2Os work in Directus to understand O2Ms, you must understand M2Os
and O2Ms to understand M2Ms, etc.

:::

## Overview

The Data Studio makes _the process_ of configuring relational data models easier, faster, and more intuitive by offering
no-code configuration. Directus _does not_ enforce opinionated schemas, rule systems, or other arbitrary limitations to
your data models. Therefore, aside from any technical limitations of your project's infrastructure or core requirements
for any relational data model, _like having a primary key field for every collection or a data type assigned to every
field,_ you are free to build the data model as you want.

In this guide, we will go over the following topics:

- What kinds of relationships exist within Directus.
- How to configure a desired relationship within the Data Studio.
- How relationships are implemented in the data model and displayed in the Data Studio.
- When it might be appropriate to use a given type of relationship.

By the end, you'll understand everything needed to start building data models in Directus, even if relational data model
concepts are a new concept to you.

### Directus vs Classic Data Model Terms

When we use classic data model terms, _such as data table, column, row, etc..._ this signals that the explanation is
focused strictly on what happens in the database. When Directus terminology is used, _such as collection, field, item,
etc..._ this signals that the explanation includes Directus logic and functionality.

## Many-to-One (M2O)

<!-- <video title="Configure an M2O Relationship" autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video> -->

In an M2O relationship, multiple items from the parent collection are linked to one item in a related collection. For
example, there are many cities in a country, but a city can only be in one country.

To create an M2O relationship, we add a foreign key field to the parent collection, which links items from the parent
collection to items in the related collection. If we have two tables, `cities` and `countries`, we can create a
`cities.country_id` foreign key field.

![Many-to-One Relational Diagram](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relations-20221026/m2o-20221026A.webp)

Let's take a look at the schema.

```
cities
- id
- name
- country_id (a foreign key field, stores a key from countries.id)
```

```
countries
- id
- name
```

Note the following things from the schema above:

- An M2O relationship requires just one column within the parent table.
- When an M2O relational field is configured in Directus, an Item Page on the parent collection will enable access to
  the item from the related collection. So in our example above, an Item Page in `cities` will enable access to the
  related country from the `countries` table.

However, in the Directus Data Studio, an M2O field does not automatically provide access to the parent collection's
items within the related collection. In our example, this means that when you open an Item Page in `countries`, you will
not see related cities.

This is where O2M fields come in to play.

::: tip Configure an M2O

The easiest way to configure an M2O field is to follow the guide on how to
[create a field (standard)](/app/data-model/fields#create-a-field-standard) and select the M2O Interface from the
template wizard.

:::

## One-to-Many (O2M)

Within a relational database, an O2M relationship is the exact same type of relationship as an M2O. Remember, at the end
of the [M2O](#many-to-one-m2o) section, we learned that configuring an M2O in Directus does not let us access related
items within an Item Page on the related collection. In Directus, configuring an O2M creates an
[Alias](/user-guide/overview/glossary#alias) field, which lets us access related items. To demonstrate this, let's
continue with the `cities` and `countries` example relationship used in the M2O section.

![One-to-Many Relational Diagram](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relations-20221026/o2m-20221026A.webp)

Let's take a look at the schema.

```
countries
- id
- name
- cities (the O2M alias field, does not exist in the data table. Allows access to all cities linked to a country.)
```

```
cities
- id
- name
- country_id (the M2O field)
```

Note the following points from the schema above. When we create an O2M in Directus:

- Since the perspective is flipped, we now consider `countries` to be the parent collection.
- It isn't always necessary to create an O2M. In some cases, you won't want or need to access items from both sides.
- At first glance, this O2M alias field might make it _look and feel_ like a new column was created, but the O2M field
  is purely _virtual_. It creates an Interface within the Data Studio to access items from an O2M perspective. In other
  words, the O2M alias field allows us to access any related items from `cities` within an Item Details Page in the
  `countries` collection.

<!-- <video title="Configure an M2O Relationship" autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video> -->

::: tip Configure an O2M

The easiest way to configure an O2M is to follow the guide on how to
[create a field (standard)](/app/data-model/fields#create-a-field-standard) and select the O2M alias field type from the
template wizard.

:::

## One-to-One (O2O)

Directus does not include a dedicated One-to-One (O2O) relationship type or Interface. However, in the database, O2O is
almost exactly the same as an M2O. The only difference is that an O2O enforces _cardinality_. In other words, one item
from the parent collection can be linked with one item on the related collection, and vice-versa.

For example, each country has one capital city, and vice versa. This is an O2O. To demonstrate how it works, let's add
this O2O to the `cities` and `countries` example relationship used in the previous sections.

The first strategy you may think of it to add a new `capital_city` field on the `countries` collection, storing the name
of the capital city directly. But this would create [duplicate data](/app/data-model#avoid-data-duplication), because
the same city would exist in both `countries.capital_city` as well as `cities.name`. But remember, we want to _avoid
duplicate data!_

![Duplicate Data from Capital Cities](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relations-20221026/o2o-duplicate-20221026A.webp)

Instead, we want to use an O2O relationship. Let's try adding a `cities.capital_of` field.

![An inefficient One-to-One Relationship](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relations-20221026/o2o-inefficient-20221026A.webp)

Let's take a look at the schema.

```
cities
- id
- name
- country_id
- capital_of (The O2O field. Actually an M2O, configured to store unique values, stores foreign key from countries.id)
```

```
countries
- id
- name
- cities
```

The O2O relationship in the schema above works, and in some cases it may not matter which collection to configure the
O2O onto. But in this case it is sub-optimal. Since _most cities_ are not capital cities, the column will mostly contain
`NULL` values. However, every single country has a capital city. So if we create the O2O on the `countries` collection,
it will be much more efficient.

![A One-to-One Relationship](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relations-20221026/o2o-20221026A.webp)

Let's take a look at the schema.

```
countries
- id
- name
- cities
- capital_city (The O2O field. Actually an M2O, configured to store unique values, stores foreign key from cities.id)
```

```
cities
- id
- name
- country_id
```

Note the following points from the schema above. When we create an O2O in Directus:

- We can add the O2O field on either collection. However, in some cases it is more efficient to add it to a specific
  collection.
- Since the O2O field is really just an M2O field behind the scenes, and since Directus doesn't automatically display
  M2O fields in the related collection, you may want to [configure an O2M field](#one-to-many-o2m) so that you can
  access items from the related collection as well.

::: tip Configure an O2O

<!-- <video title="Configure an O2O Relationship" autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video> -->

The easiest way to configure an O2O is to follow the guide on how to
[create a field (standard)](/app/data-model/fields#create-a-field-standard) and select the **M2O** field type from the
template wizard. Then, configure the field's schema, toggling on **Unique** so that each value in the M2O field is
unique, resulting in an O2O relationship.

:::

## Many-to-Many (M2M)

The relationship types we have seen so far only required one foreign key column to link the parent collection and
related collection. An M2M relationship is composed _of two foreign key columns_ stored within an additional table,
called a _junction table_, which stores each linked row between the parent table and related table.

Junction tables are required in M2M relationships because the number of relationships created can _(and often will!)_
outnumber the number of rows in either data table. In other words, if you have `x` rows in the parent column and `y`
rows in the related column, you need room to store up to `x * y` rows. Junction tables provide a place to store all the
relationships between rows, no matter how many exist.

To demonstrate this, let's think about the relationship between recipes and ingredients: a _recipe_ can have many
_ingredients_, and _ingredients_ can be in many _recipes_.

![Many-to-Many Relational Diagram](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relationships-20220805/m2m-20220805A.webp)

Let's take a look at the schema.

```
recipes
- id
- name
- ingredients (An M2M alias field. Does not exist in the database, allows access to ingredients linked from recipe_ingredients)
```

```
recipes_ingredients (junction collection)
- id
- recipe (stores foreign key from recipes.id)
- ingredient (stores foreign key from ingredients.id)
- quantity (A "context" field. Stores other data associated with the relationship. These are optional.)
```

```
ingredients
- id
- name
```

Note the following points from the schema above. When we create an M2M in Directus:

- Our junction collection, `recipe_ingredients`, each row contains two foreign key columns. This is what creates the
  relationships between the two tables.
- Assuming the M2M alias field is created within the `recipes` collection, Directus does not automatically add a field
  to display recipes within the `ingredients` collection. However, you can easily add such a field when creating the M2M
  field within the `recipes` collection, by clicking on `Continue in Advanced Field Creation Mode`, opening the
  `Relationship` tab and selecting `Add M2M to "ingredients"`:

```
ingredients
- id
- name
- recipes (an M2M alias field, does not exist in the database, enables access to all the recipes related to an ingredient)
```

- Notice that the junction collection also has a `quantity` field, which tracks how much of each ingredient is needed
  for the recipe. This is called a _contextual field_. The Data Studio provides full access to the junction collection,
  so you can add any number of contextual fields needed to the junction collection.
- You can also have a self-referencing M2M relationship that connects items in the _same collection_. One example is
  "Related Articles", where each article relates to many other articles.

::: tip Configure an M2M

<!-- <video title="Configure an O2O Relationship" autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video> -->

The easiest way to configure an M2M is to follow the guide on how to
[create a field (standard)](/app/data-model/fields#create-a-field-standard) and select **Many to Many** from the
template wizard.

:::

## Many-to-Any (M2A)

Sometimes called a _matrix field_ or _replicator_, an M2A relationship allows you to link items from the parent
collection to any item in any collection in the database. When you configure an M2A in Directus, an M2A
[Alias](/user-guide/overview/glossary#alias) field is created as well as a junction collection, like we saw on M2M
relationships. The difference is that the junction collection on an M2A also has a field to store the **collection key**
_(the name of the collection)_ for related collections.

One common example of when M2As are used is for _page builders_, which have a `pages` collection that combines multiple
collections for each type of page section, such as `heading`, `text_bodies`, `image`, `video`, _etc_.

![Many-to-Any Relational Diagram](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relationships-20220805/m2a-20220805A.webp)

Let's take a look at the schema:

```
pages
- id
- name
- sections (An M2A alias field, does not exist in the database. Provides access to items from page_sections.)
```

```
page_sections (junction collection)
- id
- pages_id (An M2O, stores foreign keys from pages.id)
- collection (An M2O, stores name of the related collection, for example headings, text_bodies, or images.)
- item (An M2O, stores foreign keys from headings.id, text.id, images.id, etc.)
```

```
headings
- id
- title
```

```
text_bodies
- id
- text
```

```
images
- id
- file
```

Note the following points from the schema above. When we create an M2A in Directus:

- Compared to the M2O and M2M relationships, there may be a lower likelihood that you will need to configure alias
  fields on related collections, such as `headings`, `text_bodies` and `images`, as these collections may not be as
  useful without the parent collection.
- Each collection has a unique collection name, so this serves as an adequate foreign key in the
  `page_sections.collection` field.

::: tip Configure an M2A

<!--
<video title="Configure an M2A Relationship" autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video>
-->

The easiest way to configure an M2A is to follow the guide on how to
[create a field (standard)](/app/data-model/fields#create-a-field-standard) and select the **Many to Any** Interface
from the template wizard.

:::

## Translations (O2M)

Directus provides this special relational Interface designed specifically to handle translations. When you create a
Translations O2M in the Data Studio, the following things happen within your data model. A Translations O2M alias field
is created. A junction collection and a `languages` collection are created. All your translations are stored within
context fields, configured by you, on the junction collection. Therefore, when you create a Translations O2M, you also
create an M2M relationship behind the scenes. So remember, it is called the Translations O2M because we interact with
the Translations O2M alias field. But behind the scenes, it is powered by an M2M.

To demonstrate, let's create a Translations O2M relationship for `articles`, a common content type that you may want to
translate.

![Translations O2M](https://cdn.directus.io/docs/v9/configuration/data-model/relationships/relationships-20220805/o2m-translations-20220805A.webp)

Let's take a look at the schema.

```
articles
- id
- author (a field that is not translated)
- date_published (a field that is not translated)
- translations (A Translations O2M alias field, does not exist within the data table. Allows access to items from article_translations)
```

```
article_translations
- id
- article_id (an M2O, stores foreign key article.id)
- language_id (an M2O, stores foreign key languages.language_code)
- title (A context field, created by you. Stores a translation of the Article Title)
- text (A context field, created by you. Stores a translation of the Article Text)
```

```
languages
- language_code (A primary key. A manually typed language code, e.g., "en-US")
- name  (Stores the language name, e.g., "English")
```

Note the following points from the schema above. When we create a Translations O2M:

- As demonstrated by `article_translations.title` and `article_translations.text`, any _translated_ fields should be
  added as context fields on the junction collection.
- You are not bound to use this for translations. You can build your data model as desired. You could create individual
  fields for each translation, such as `title_english`, `title_german`, `title_french`, and so on. However, this is not
  easily extensible and it creates a sub-optimal experience to have every single translation of every field on the item
  details page. The Translations O2M alias field is designed specifically to make the translation process easier.
- There may come a time when you want to make a pre-existing parent field translatable. To do this, you can
  [duplicate a field](/app/data-model/fields#duplicate-a-field), move it to the translation collection, and then delete
  the parent field. However, be aware that duplicating a field does _not_ duplicate any existing field values.

::: tip Configure a Translations O2M

<!--
<video title="Configure a Translations O2M" autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video>
-->

The easiest way to configure a Translations relationship is to follow the guide on how to
[create a field (standard)](/app/data-model/fields#create-a-field-standard) and select the **Translations O2M**
Interface from the template wizard.

:::
