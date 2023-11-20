---
description: Learn about the ItemsService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Items

The `ItemsService` provides access to perform operations on items in a collection. It requires a collection and a schema
to operate.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { ItemsService } = services;
  const schema = await getSchema();

  router.get('/', async (req, res) => {
    const itemsService = new ItemsService('collection_name', { schema });
  });
});
```

## Create an Item

```js
router.post('/items/:collection', async (req, res) => {
  const { collection } = req.params;
  const itemsService = new ItemsService(collection, { schema });

  const data = await itemsService.createOne(req.body);
  res.json(data);
});
```

## Get an Item

```js
router.get('/items/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const itemsService = new ItemsService(collection, { schema });

  const data = await itemsService.readOne(id);
  res.json(data);
});
```

## Update an Item

```js
router.patch('/items/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const itemsService = new ItemsService(collection, { schema });

  const data = await itemsService.updateOne(id, req.body);
  res.json(data);
});
```

## Delete an Item

```js
router.delete('/items/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const itemsService = new ItemsService(collection, { schema });

  await itemsService.deleteOne(id);
  res.json();
});
```

::: tip Explore ItemsService In-depth

Check out the full list of methods
[in our codebase](https://github.com/directus/directus/blob/main/api/src/services/items.ts).

:::
