---
description: Learn about the ItemsService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Items in the Database

The `ItemsService` allows you to work with and retrieve items data by creating endpoints to items in a collection. It
provides a way to perform CRUD operations on items in a database.

## Create an Item in a Specific Collection

```js
  router.post('/items/:collection', async (req, res) => {
    const schema = await getSchema();
    const { collection } = req.params;

    const service = new ItemsService(collection, { schema });
    const data = await service.createOne(req.body);

    res.json(data);
  });
```

## Get an Item from a Specific Collection

```js
router.get('/items/:collection/:id', async (req, res) => {
    const schema = await getSchema();

    const { collection, id } = req.params;
    const service = new ItemsService(collection, { schema });

    const data = await service.readOne(id);
    res.json(data);
  });
```

## Update an Item in a Specific Collection

```js
 router.patch('/items/:collection/:id', async (req, res) => {
    const schema = await getSchema();

    const { collection, id } = req.params;

    const service = new ItemsService(collection, { schema });
    const data = await service.updateOne(id, req.body);

    res.json(data);
  });
```

## Delete an Item from a Specific Collection

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
