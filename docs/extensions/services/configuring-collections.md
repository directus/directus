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
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { CollectionsService } = services;

  router.get('/', async (req, res) => {
    const collectionsService = new CollectionsService({
      schema: await getSchema(),
      accountability: req.accountability
    });

    // Your route handler logic
  });
});
```

### Create a Collection

```js
router.post('/', async (req, res) => {
  const collectionsService = new CollectionsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const collectionKey = await collectionsService.createOne({
    collection:'articles',
    meta: {
      note: 'Blog posts',
    },
  });

  const data = await collectionsService.readOne(collectionKey);

  res.json(data);
});
```

### Read a Collection

```js
router.get('/', async (req, res) => {
  const collectionsService = new CollectionsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await collectionsService.readOne('collection_name');

  res.json(data);
});
```

### Update a Collection

```js
router.patch('/', async (req, res) => {
  const collectionsService = new CollectionsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await collectionsService.updateOne('collection_name', {
    meta: {
      note: 'Updated blog posts',
    },
  });

  res.json(data);
});
```

### Delete a Collection

```js
router.delete('/', async (req, res) => {
  const collectionsService = new CollectionsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await collectionsService.deleteOne('collection_name');

  res.json(data);
});
```

## FieldsService

The `FieldsService` provides access to perform CRUD operations on fields used in collections.

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { FieldsService } = services;

  router.get('/', async (req, res) => {
    const fieldsService = new FieldsService({
      schema: await getSchema(),
      accountability: req.accountability
    });

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

  const fieldsService = new FieldsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  await fieldsService.createField('collection_name', field);

  const data = await fieldsService.readOne(
    'collection_name',
    field.field,
  );

  res.json(data);
});
```

### Read a Field

```js
router.get('/', async (req, res) => {
  const fieldsService = new FieldsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await fieldsService.readAll('collection_name');

  res.json(data);
});
```

### Update a Field

```js
router.patch('/', async (req, res) => {
  const fieldsService = new FieldsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  await fieldsService.updateField('collection_name', {
    meta: {
      note: 'Put the title here',
    },
    schema: {
      default_value: 'Hello World!',
    },
    field: 'field_name',
  });

  const data = await fieldsService.readOne(
    'collection_name',
    'field_name',
  );

  res.json(data);
});
```

::: warning Field Name

Updating the field name is not supported at this time.

:::

### Delete a Field

```js
router.delete('/', async (req, res) => {
  const fieldsService = new FieldsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await fieldsService.deleteField('collection_name', 'field_name');

  res.json(data);
});
```

## RelationsService

The `RelationsService` allows you to perform CRUD operations on relations between items.

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { RelationsService } = services;

  router.get('/', async (req, res) => {
    const relationsService = new RelationsService({
      schema: await getSchema(),
      accountability: req.accountability
    });

    // Your route handler logic
  });
});
```

### Create a Relation

```js
router.post('/', async (req, res) => {
  const relationsService = new RelationsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await relationsService.createOne({
    collection: 'articles',
    field: 'featured_image',
    related_collection: 'directus_files',
  });

  const data = await relationsService.readOne(data);

  res.json(data);
});
```

### Get a Relation

```js
router.get('/', async (req, res) => {
  const relationsService = new RelationsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await relationsService.readOne('collection_name', 'field_name');

  res.json(data);
});
```

### Update a Relation

```js
router.patch('/', async (req, res) => {
  const relationsService = new RelationsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

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
router.delete('/', async (req, res) => {
  const relationsService = new RelationsService({
    schema: await getSchema(),
    accountability: req.accountability
  });

	const data = await relationsService.deleteOne(
    'collection_name',
    'field_name',
  );

  res.json(data);
});
```

::: tip Explore Services In-Depth

Refer to the full list of methods [in our codebase](https://github.com/directus/directus/blob/main/api/src/services).

:::
