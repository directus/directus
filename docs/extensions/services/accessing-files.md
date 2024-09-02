---
description: Learn about the FilesService in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Accessing Files

The `FilesService` provides access to upload, import, and perform CRUD operations on files.

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { FilesService } = services;

  router.get('/', async (req, res) => {
    const filesService = new FilesService({
      schema: await getSchema(),
      accountability: req.accountability
    });

    // Your route handler logic
  });
});
```

## Import a File

```js
router.post('/', async (req, res) => {
  const filesService = new FilesService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const assetKey = await filesService.importOne({
    url: file_url,
    data: file_object,
  });

  const data = await filesService.readOne(assetKey);

  res.json(data);
});
```

## Upload a File

Uploading a file requires the use of an external dependency called _Busboy_, a streaming parser for Node.js. Import it
at the top of your file as:

```js
import Busboy from 'busboy'
```

Create the route to upload a file:

```js
router.post('/', async (req, res, next) => {
  const filesService = new FilesService({
    schema: await getSchema(),
    accountability: req.accountability,
  });

  const busboy = Busboy({ headers: req.headers });

  busboy.on('file', async (_, fileStream, { filename, mimeType }) => {

    const data = {
      filename_download: filename,
      type: mimeType,
      storage: 'local',
    };

    try {
      const primaryKey = await filesService.uploadOne(fileStream, data);
      res.json({ id: primaryKey });
    } catch (error) {
      busboy.emit('error', error);
    }
  });

  busboy.on('error', (error) => {
    next(error);
  });

  req.pipe(busboy);
});
```

::: tip The File Object

Refer to the full list of properties the file can have [in our documentation](/reference/files.html#the-file-object).

:::

## Read a File

```js
router.get('/', async (req, res) => {
  const filesService = new FilesService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await filesService.readOne('file_id');

  res.json(data);
});
```

## Update a File

```js
router.patch('/', async (req, res) => {
  const filesService = new FilesService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await filesService.updateOne('file_id', { title: 'Random' });

  res.json(data);
});
```

## Delete a File

```js
 router.delete('/', async (req, res) => {
  const filesService = new FilesService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await filesService.deleteOne('file_id');

  res.json(data);
});
```

::: tip Explore FilesService In-Depth

Refer to the full list of methods
[in our codebase](https://github.com/directus/directus/blob/main/api/src/services/files.ts).

:::
