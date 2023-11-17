---
description: Learn about the FilesService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Files

The `FilesService` provides access to upload, import, and perform other operations on files.

### Import a File

```js
router.post('/files', async (req, res) => {
  const schema = await getSchema();
  const service = new FilesService({ schema });
  const assetKey = await service.importOne(req.body.url);

  const data = await service.readOne(assetKey);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Read a File

```js
router.get('/files/:id', async (req, res) => {
  const schema = await getSchema();
  const service = new FilesService({ schema });
  const { id } = req.params;

  const data = await service.readOne(id);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Delete a File

```js
 router.delete('/files/:id', async (req, res) => {
  const schema = await getSchema();
  const service = new FilesService({ schema });
  const { id } = req.params;

  const data = await service.deleteOne(id);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

::: tip Explore FilesService In-depth

Check out the full list of methods
[in our codebase](https://github.com/directus/directus/blob/main/api/src/services/files.ts).

:::
