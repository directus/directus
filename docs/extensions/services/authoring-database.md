---
description: Learn about the Services for authoring the database in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Authoring the Database

Directus provides services such as `CollectionsService`, `FieldsService` and `RelationsService` to programmatically
configure and modify the database schema.

## CollectionsService

The `CollectionsService` is responsible for managing and manipulating data in collections. Utilize it to create CRUD
endpoints to collections.

### Create a Collection

```js
  router.post('/collections', async (req, res) => {
    const schema = await getSchema();

    const service = new CollectionsService({ schema });

    const collectionKey = await service.createOne(req.body);

    const record = await service.readOne(collectionKey);
    res.locals['payload'] = { data: record || null };

    res.json(record);
  });
```

### Read Collection

```js
 router.get('/collections/:collection', async (req, res) => {
    const schema = await getSchema();

    const { collection } = req.params;

    const service = new CollectionsService({ schema });
    const data = await service.readOne(collection);
    res.locals['payload'] = { data: collection || null };
    res.json(data);
  });
```

### Update Collection

```js
 router.patch('/collections/:collection', async (req, res) => {
    const schema = await getSchema();

    const { collection } = req.params;

    const service = new CollectionsService({ schema });
    const data = await service.updateOne(collection, req.body);
    res.locals['payload'] = { data: collection || null };
    res.json(data);
  });
```

### Delete Collection

```js
 router.delete('/collections/:collection', async (req, res) => {
    const schema = await getSchema();
    const { collection } = req.params;

    const service = new CollectionsService({ schema });
    await service.deleteOne(collection);
    res.json();
  });
```

## FieldsService

The `FieldsService` provides access to perform CRUD operations on fields used in collections and item records.

### Create a Field

```js
  router.post('/fields/:collection', async (req, res) => {
    const schema = await getSchema();
    const { collection } = req.params;

    const service = new FieldsService({ schema });

    const field = req.body;
    await service.createField(collection, field);

    const createdField = await service.readOne(collection, field.field);
    res.locals['payload'] = { data: createdField || null };

    res.json(createdField);
  });
```

### Read Field

```js
 router.get('/fields/:collection', async (req, res) => {
    const schema = await getSchema();

    const { collection } = req.params;

    const service = new FieldsService({ schema });

    const data = await service.readAll(collection);
    res.locals['payload'] = { data: data || null };
    res.json(data);
  });
```

### Update Field

```js
 router.patch('/fields/:collection/:field', async (req, res) => {
    const schema = await getSchema();

    const { collection, field } = req.params;

    const service = new FieldsService({ schema });
    await service.updateField(collection, { ...req.body, field });

    const updatedField = await service.readOne(collection, field);
    res.locals['payload'] = { data: updatedField || null };
    res.json(updatedField);
  });
```

Updating the field name is not supported at this time.

### Delete Field

```js
 router.delete('/fields/:collection/:field', async (req, res) => {
    const schema = await getSchema();
    const { collection, field } = req.params;
    const service = new FieldsService({ schema });
    await service.deleteField(collection, field);
    res.json();
  });
```

## RelationsService

The `RelationsService` allows you to manage relationships and references between items in Directus. Utilize it to create
endpoints that perform CRUD operations on relations.

### Create Relation

```js
router.post('/relations', async (req, res) => {
    const schema = await getSchema();

    const service = new RelationsService({ schema });

    const data = await service.createOne(req.body);

    const record = await service.readOne(data);
    res.locals['payload'] = { data: record || null };

    res.json(record);
  });
```

### Get Relation

```js
router.get('/relations/:collection/:field', async (req, res) => {
    const schema = await getSchema();

    const service = new RelationsService({ schema });
    const { collection, field } = req.params;

    const data = await service.readOne(collection, field);

    res.json(data);
  });
```

::: tip Explore Services In-depth

Check out the full list
[here](https://github.com/directus/directus/blob/bbefc62ef4727edb0b25eaafb6bb44273f79f834/api/src/services).

:::
