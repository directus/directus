---
description: Learn about the Services for authoring the database in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Configuring Collections, Fields, and Relations

Use the `CollectionsService`, `FieldsService` and `RelationsService` to configure and modify the data model.

## CollectionsService

The `CollectionsService` is responsible for managing and manipulating data in collections. Utilize it to perform CRUD
operations on collection.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { CollectionsService } = services;
  const schema = await getSchema();

  router.get('/', async (req, res) => {
    const collectionsService = new CollectionsService({ schema });
  });
});
```

### Create Collection

```js
router.post('/collections', async (req, res) => {
  const collectionsService = new CollectionsService({ schema });
  const collectionKey = await collectionsService.createOne(req.body);

  const record = await collectionsService.readOne(collectionKey);
  res.locals['payload'] = { data: record || null };
  res.json(record);
});
```

### Read Collection

```js
router.get('/collections/:collection', async (req, res) => {
  const { collection } = req.params;
  const collectionsService = new CollectionsService({ schema });
  const data = await collectionsService.readOne(collection);

  res.locals['payload'] = { data: collection || null };
  res.json(data);
});
```

### Update Collection

```js
router.patch('/collections/:collection', async (req, res) => {
  const { collection } = req.params;
  const collectionsService = new CollectionsService({ schema });

  const data = await collectionsService.updateOne(collection, req.body);
  res.locals['payload'] = { data: collection || null };
  res.json(data);
});
```

### Delete Collection

```js
router.delete('/collections/:collection', async (req, res) => {
  const { collection } = req.params;
  const collectionsService = new CollectionsService({ schema });

  await collectionsService.deleteOne(collection);
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

  router.get('/', async (req, res) => {
    const fieldsService = new FieldsService({ schema });
  });
});
```

### Create Field

```js
router.post('/fields/:collection', async (req, res) => {
  const { collection } = req.params;
  const fieldsService = new FieldsService({ schema });

  const field = req.body;
  await fieldsService.createField(collection, field);

  const createdField = await fieldsService.readOne(collection, field.field);
  res.locals['payload'] = { data: createdField || null };
  res.json(createdField);
});
```

### Read Field

```js
router.get('/fields/:collection', async (req, res) => {
  const { collection } = req.params;
  const fieldsService = new FieldsService({ schema });

  const data = await fieldsService.readAll(collection);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Update Field

```js
router.patch('/fields/:collection/:field', async (req, res) => {
  const { collection, field } = req.params;
  const fieldsService = new FieldsService({ schema });

  await fieldsService.updateField(collection, { ...req.body, field });
  const updatedField = await fieldsService.readOne(collection, field);

  res.locals['payload'] = { data: updatedField || null };
  res.json(updatedField);
});
```

Updating the field name is not supported at this time.

### Delete Field

```js
router.delete('/fields/:collection/:field', async (req, res) => {
  const { collection, field } = req.params;
  const fieldsService = new FieldsService({ schema });

  await fieldsService.deleteField(collection, field);
  res.json();
});
```

## RelationsService

The `RelationsService` allows you to manage relationships and references between items in Directus. Utilize it to
perform CRUD operations on relations.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { RelationsService } = services;
  const schema = await getSchema();

  router.get('/', async (req, res) => {
    const relationsService = new RelationsService({ schema });
  });
});
```

### Create Relation

```js
router.post('/relations', async (req, res) => {
  const relationsService = new RelationsService({ schema });
  const data = await relationsService.createOne(req.body);

  const record = await relationsService.readOne(data);
  res.locals['payload'] = { data: record || null };
  res.json(record);
});
```

### Get Relation

```js
router.get('/relations/:collection/:field', async (req, res) => {
  const relationsService = new RelationsService({ schema });
  const { collection, field } = req.params;

  const data = await relationsService.readOne(collection, field);

  res.json(data);
});
```

### Update Relation

```js
router.patch('/relations/:collection/:field', async (req, res) => {
  const relationsService = new RelationsService({ schema });
  const { collection, field } = req.params;

  const data = await relationsService.updateOne(collection, field, req.body);

  res.json(data);
});
```

### Delete Relations

```js
router.delete('/relations/:collection/:field', async (req, res) => {
  const relationsService = new RelationsService({ schema });
  const { collection, field } = req.params;
  const data = await relationsService.deleteOne(collection, field);

  res.json(data);
});
```

::: tip Explore Services In-depth

Check out the full list of methods [in our codebase](https://github.com/directus/directus/blob/main/api/src/services).

:::
