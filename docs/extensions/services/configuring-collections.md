---
description: Learn about the Services for authoring the database in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Configuring Collections, Fields, and Relations

Use the `CollectionsService`, `FieldsService` and `RelationsService` to configure and modify the data model of a
collection.

## CollectionsService

The `CollectionsService` is used for manipulating data and performing CRUD operations on a collection.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { CollectionsService } = services;
  const schema = await getSchema();
  const collectionsService = new CollectionsService({ schema });

  router.get('/', async (req, res) => {
    // Your route handler logic
  });
});
```

### Create a Collection

```js
router.post('/', async (req, res) => {
  const collectionKey = await collectionsService.createOne({
    collection:'articles',
    meta: {
      note: 'Blog posts',
    },
  });

  const record = await collectionsService.readOne(collectionKey);
  res.locals['payload'] = { data: record || null };
  res.json(record);
});
```

### Read a Collection

```js
router.get('/', async (req, res) => {
  const data = await collectionsService.readOne('collection_name');

  res.locals['payload'] = { data: collection || null };
  res.json(data);
});
```

### Update a Collection

```js
router.patch('/', async (req, res) => {
  const data = await collectionsService.updateOne('collection_name', {
    meta: {
      note: 'Updated blog posts',
    },
  });
  res.locals['payload'] = { data: collection || null };
  res.json(data);
});
```

### Delete a Collection

```js
router.delete('/', async (req, res) => {
  await collectionsService.deleteOne('collection_name');

  res.json();
  });
```

## FieldsService

The `FieldsService` provides access to perform CRUD operations on fields used in collections.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { FieldsService } = services;
  const schema = await getSchema();
  const fieldsService = new FieldsService({ schema });

  router.get('/', async (req, res) => {
    // Your route handler logic
  });
});
```

### Create a Field

```js
router.post('/', async (req, res) => {
  const field = {
    field: 'title',
    type: 'string',
    meta: {
      icon: 'title',
    },
    schema: {
      default_value: 'Hello World',
    },
  };
  await fieldsService.createField('collection_name', field);

  const createdField = await fieldsService.readOne(
    'collection_name',
    field.field,
  );
  res.locals['payload'] = { data: createdField || null };
  res.json(createdField);
});
```

### Read a Field

```js
router.get('/', async (req, res) => {
  const data = await fieldsService.readAll('collection_name');
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Update a Field

```js
router.patch('/', async (req, res) => {
  await fieldsService.updateField('collection_name', {
    meta: {
      note: 'Put the title here',
    },
    schema: {
      default_value: 'Hello World!',
    },
    field: 'field_name',
  });
  const updatedField = await fieldsService.readOne(
    'collection_name',
    'field_name',
  );

  res.locals['payload'] = { data: updatedField || null };
  res.json(updatedField);
});
```

::: warning Field Name

Updating the field name is not supported at this time.

:::

### Delete a Field

```js
router.delete('/', async (req, res) => {
  await fieldsService.deleteField('collection_name', 'field_name');
  res.json();
});
```

## RelationsService

The `RelationsService` allows you to perform CRUD operations on relations between items.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { RelationsService } = services;
  const schema = await getSchema();
  const relationsService = new RelationsService({ schema });

  router.get('/', async (req, res) => {
    // Your route handler logic
  });
});
```

### Create a Relation

```js
router.post('/', async (req, res) => {
  const data = await relationsService.createOne({
    collection: 'articles',
    field: 'featured_image',
    related_collection: 'directus_files',
  });

  const record = await relationsService.readOne(data);
  res.locals['payload'] = { data: record || null };
  res.json(record);
});
```

### Get a Relation

```js
router.get('/', async (req, res) => {
  const data = await relationsService.readOne('collection_name', 'field_name');

  res.json(data);
});
```

### Update a Relation

```js
router.patch('/', async (req, res) => {
  const data = await relationsService.updateOne(
    'collection_name',
    'field_name',
    {
      meta: {
        one_field: 'articles',
      },
    },
  );

  res.json(data);
});
```

### Delete a Relation

```js
router.delete('/', async (req, res) => {  const data = await relationsService.deleteOne(
    'collection_name',
    'field_name',
  );

  res.json(data);
});
```

::: tip Explore Services In-depth

Refer to the full list of methods [in our codebase](https://github.com/directus/directus/blob/main/api/src/services).

:::
