---
description: Learn about the FilesService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Files

The `FilesService` provides access to upload, import, and perform CRUD operations on files.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { FilesService } = services;
  const schema = await getSchema();
  const filesService = new FilesService({ schema });

  router.get('/', async (req, res) => {
    // Your route handler logic
  });
});
```

### Import a File

```js
router.post('/', async (req, res) => {
  const assetKey = await filesService.importOne({
    url: file_url,
    data: file_object,
  });

  const data = await filesService.readOne(assetKey);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Read a File

```js
router.get('/', async (req, res) => {
  const data = await filesService.readOne('file_id');
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Update a File

```js
router.patch('/', async (req, res) => {
  const data = await filesService.updateOne('file_id', { title: 'Random' });
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Delete a File

```js
 router.delete('/', async (req, res) => {
  const data = await filesService.deleteOne('file_id');
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

::: tip Explore FilesService In-depth

Refer to the full list of methods
[in our codebase](https://github.com/directus/directus/blob/main/api/src/services/files.ts).

:::
