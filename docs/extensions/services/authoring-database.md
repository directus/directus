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
    const data = await service.deleteOne(collection);
    res.locals['payload'] = { data: collection || null };
    res.json(data);
  });
```
