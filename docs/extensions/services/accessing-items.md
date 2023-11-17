---
description: Learn about the ItemsService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Items

The `ItemsService` provides access to perform operations on items in a collection. It requires a collection and a schema
to operate.

In the example below, we're desctructuring `services` and `getSchema` from context and in turn `ItemsService` from
`services`.

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { ItemsService } = services;

  router.get('/', async (req, res) => {
    const schema = await getSchema();
    const service = new ItemsService('collection_name', { schema });
  });
});
```

## Create an Item

```js
router.post('/items/:collection', async (req, res) => {
  const schema = await getSchema();
  const { collection } = req.params;

  const service = new ItemsService(collection, { schema });
  const data = await service.createOne(req.body);
  res.json(data);
});
```

## Get an Item

```js
router.get('/items/:collection/:id', async (req, res) => {
  const schema = await getSchema();
  const { collection, id } = req.params;
  const service = new ItemsService(collection, { schema });

  const data = await service.readOne(id);
  res.json(data);
});
```

## Update an Item

```js
router.patch('/items/:collection/:id', async (req, res) => {
  const schema = await getSchema();
  const { collection, id } = req.params;
  const service = new ItemsService(collection, { schema });

  const data = await service.updateOne(id, req.body);
  res.json(data);
});
```

## Delete an Item

```js
router.delete('/items/:collection/:id', async (req, res) => {
  const schema = await getSchema();
  const { collection, id } = req.params;
  const service = new ItemsService(collection, { schema });

  await service.deleteOne(id);
  res.json();
});
```

::: tip Explore ItemsService In-depth

Check out the full list [here](https://github.com/directus/directus/blob/main/api/src/services/items.ts).

:::
