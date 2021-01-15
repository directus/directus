# Relationships

> As you might have guessed, relationships are a crucial part of any relational database. Directus
> supports all standard relationship types, as well as a few more _compound_ types that offer
> greater flexibility.

## Understanding Relationships

While it may seem complex at first, relational data is actually quite straightforward once you
understand what's happening behind the confusing terminology. Before diving into the details of each
type, let's first cover a few basics that will help you better visualize each in your mind's eye.

### PKs vs FKs

Every [item](/concepts/platform-overview#items) in a relational database has a unique "key" that
identifies it within its [collection](/concepts/platform-overview#collections). Because it's
required, the key is the first [field](/concepts/platform-overview#fields) created within a
collection, typically storing an "auto-increment" number, an automatically generated unique hash, or
a manually entered value. They are often abbreviated to "PK" (Primary Key), "ID" (Identifier), "UID"
(Unique Identifier), or "UUID" (Universally Unique Identifier), depending on the type of value they
store. After it's created, the value of an item's PK should _never_ change.

To link items together relationally, you simply save a reference of an item's PK in a different
field. That _reference_ is called a Foreign Key (FK).

<!-- prettier-ignore-start -->
::: tip Compound Keys
We've ignored compound keys in this explanation to help keep things as simple as
possible.
:::
<!-- prettier-ignore-end -->

### Perspective Matters

Just like primary and foreign keys are directional, relationships are always relative to their
"parent" collection. Looking at the same relationship/key from the perspective of a different
collection may change or reverse its type.

## Many-to-One (M2O)

A Many-to-One (M2O) relationship exists on a field that saves a single FK. For example, a _city_ can
only be in one _country_, but a _country_ can have many _cities_. So the M2O data model would look
like this:

```
cities ("Many" Collection)
- id (PK)
- name
- country (M2O that stores the FK to a country)

country ("One" Collection)
- id (PK, the value saved to "cities.country")
- name
```

## One-to-Many (O2M)

A One-to-Many (O2M) relationship uses an alias field to reference one or more FKs in a M2O. This is
the _exact same_ relationship as the M2O above, but looking at it from the opposite perspective (see
[Perspective Matters](#perspective-matters)). So the O2M data model is the same, but adds an alias
"cities" field to the Country collection, like this:

```
country ("One" Collection)
- id (PK, the value saved to "cities.country")
- name
- *cities* (O2M alias field that pulls in references from "cities.country")

cities ("Many" Collection)
- id (PK)
- name
- country (stores the FK to a country)
```

<!-- prettier-ignore-start -->
::: tip
Manual Reordering To enable manual reordering for a O2M, simply add a field with the `sort` type
to the "many" side (`cities` in the above example).
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip Translations
The Translations interface allows [creating multilingual content](/concepts/internationalization#content-translations) relationally.
It is a standard O2M relationship, but also includes an additional field on the "many" collection to
hold the language key
:::
<!-- prettier-ignore-end -->

## Many-to-Many (M2M)

A Many-to-Many (M2M) relationship uses a "Junction Table" to connect many items from one collection,
to many items of another collection. For example, a _recipe_ can have many _ingredients_, and
_ingredients_ can be in many _recipes_. So the M2M data model would look like this:

```
recipes (Collection)
- id (PK, the value saved to "recipe_ingredients.recipe")
- name
- *ingredients* (M2M/O2M alias field that pulls in references from recipe_ingredients)

ingredients (Collection)
- id (PK, the value saved to "recipe_ingredients.ingredient")
- name
- *recipes* (M2M/O2M alias field that pulls in references from recipe_ingredients)

recipe_ingredients (Junction Collection)
- id (PK)
- recipe (stores the FK to a recipe)
- ingredient (stores the FK to a ingredient)
- quantity
```

Notice that the example above also has a `quantity` field on the junction table. You can add any
contextual fields to the junction, and they will also be included in the App's relational edit form.

<!-- prettier-ignore-start -->
::: warning M2M == O2Mx2
An M2M is technically two relationships viewed as one. Each side has a O2M
to the Junction Table that sits in the middle. In that sense, there really is no "M2M".
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip
Manual Reordering To enable manual reordering for a M2M, simply add a numeric field to the
junction table and set it as the [Collection Sort](/guides/collections#sort).
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip
Self-Referencing You can also have a M2M relationship that connects items within the _same_
collection. A common example of this is "Related Articles", where each article might relate to many
other articles.
:::
<!-- prettier-ignore-end -->

## One-to-One (O2O)

Directus does not include a one-to-one (O2O) relationship type or interface. However, O2O is
essentially the same as a M2O (storing a foreign key). The only difference is that a O2O enforces
the cardinality. In other words, selecting a relational item in a O2O means that item can not be
selected elsewhere (it can only be used once). This functionality can be added by checking and
constraining uniqueness via a [custom event hook](/concepts/api-extensions) or
[custom interface](/concepts/app-extensions).

An example of a O2O is: a _person_ only has one unique set of _fingerprints_, and those
_fingerprints_ only belong to one _person_.

## Many-to-Any (M2A)

Sometimes called a "matrix field" or "replicator", the Many-to-Any (M2A) relationship is essentially
the same as a M2M, but with one crucial difference: the junction table also stores the _parent
collection name of the FK_. This "compound key" combines the collection name and FK to provide a
unique reference to _any_ other item within the project. You can then artificially limit which
collections are valid through an "allow list".

An example of a M2A is a "page layout builder". These typically will have modular components across
several different collections (eg: "Heading", "Text Block", "Media Asset", etc), and a _Pages_
collections where you can piece them together. Therefore, the junction table will link a specific
page with specific components, allowing the creation of relational page layouts.

---

@TODO

```
[ ] o2o
[x] m2o           (dropdown)
[x] o2m           (table, repeater)

[x] m2m [o2m-m2o] (table, repeater)

[ ] o2a           (builder)
[x] a2o

[x] m2a [o2m-a2o] (builder)
[ ] a2m [o2a-m2o]
[ ] a2a [o2a-a2o] (dynamic builder)
```