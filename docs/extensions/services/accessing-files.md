---
description: Learn about the FilesService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Files

The `FilesService` provides access to upload, import, and perform other operations on files.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { FilesService } = services;
  const schema = await getSchema();

  router.get('/', async (req, res) => {
    const filesService = new FilesService({ schema });
  });
});
```

### Import File

```js
router.post('/files', async (req, res) => {
  const filesService = new FilesService({ schema });
  const assetKey = await filesService.importOne(req.body.url);

  const data = await filesService.readOne(assetKey);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Read File

```js
router.get('/files/:id', async (req, res) => {
  const filesService = new FilesService({ schema });
  const { id } = req.params;

  const data = await filesService.readOne(id);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Update File

```js
router.patch('/files/:id', async (req, res) => {
  const filesService = new FilesService({ schema });
  const { id } = req.params;

  const data = await filesService.updateOne(id, { title: 'Random' });
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Delete File

```js
 router.delete('/files/:id', async (req, res) => {
  const filesService = new FilesService({ schema });
  const { id } = req.params;

  const data = await filesService.deleteOne(id);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

::: tip Explore FilesService In-depth

Check out the full list of methods
[in our codebase](https://github.com/directus/directus/blob/main/api/src/services/files.ts).

:::
