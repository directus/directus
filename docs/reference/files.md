---
description: REST and GraphQL API documentation for file access and management in Directus.
readTime: 10 min read
pageClass: page-reference
---

<script setup lang="ts">
import { data as packages } from '@/data/packages.data.js';
</script>

# Accessing Files

> Every file managed by the platform is uploaded to the configured storage adapter, and its associated metadata is
> tracked within the `directus_files` system collection. Any requested file transformations are handled on the fly, and
> are only saved to storage.

## File Security

Data and permissions around files are associated to the `directus_files` collection.

It is recommended that you only provide public permissions to specific files or file folders (for example, a 'Public'
folder), rather than making the whole collection public. Read more on custom access permissions.

::: warning Exporting Data Creates Files

[Exporting data](/user-guide/content-module/import-export.html#export-items) creates new files and adds them to your
file storage. If these files are accessible publicly, you may leak data held in the exported collections.

:::

## Accessing a File

The location of your actual file originals is based on the project's configuration, but you can consistently access them
via the API using the following URL.

```
example.com/assets/<file-id>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4
```

::: tip SEO

You can provide an optional filename after the UUID to optimize for SEO, for example:

```
example.com/assets/<file-id>/<filename>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4/directus-logo.png
```

This optional filename is also used in the Content-Disposition header when the `?download` query parameter is used.

:::

::: warning Direct File Access

While you may _technically_ be able to expose your storage adapters root file system and access your raw files through
there, it is recommended that you always use the Directus API. This is the only way that you can take advantage of file
permissions and other built-in features.

:::

![Original File](https://cdn.directus.io/docs/v9/reference/files/original-20220216A.jpg) _Original File Used — 602KB and
1800x1200_

## Downloading a File

To download an asset with the correct filename, you need to add the `?download` query parameter to the request and the
`download` attribute to your anchor tag. This will ensure the appropriate
[Content-Disposition](https://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html) headers are added. Without this, the
download will work on the _same_ domain, however it will have the file's "id" as the filename for cross-origin requests.

### Example

```html
<a href="https://your-directus.com/assets/<file-id>?download" target="_blank" download="Your File.pdf">Download</a>
```

## Requesting a Thumbnail

Fetching thumbnails is as easy as adding a `key` query parameter to the original file's URL. In the Data Studio, you can
configure different asset presets that control the output of any given image. If a requested thumbnail doesn't yet
exist, it is dynamically generated and immediately returned.

### Preset Transformations

- **`key`** — This **key** of the [Storage Asset Preset](/user-guide/settings/project-settings#files-storage), a
  shortcut for the below parameters

### Custom Transformations

Alternatively, if you have "Storage Asset Transform" set to all, you can use the following parameters for more fine
grained control:

- **`fit`** — The **fit** of the thumbnail while always preserving the aspect ratio, can be any of the following
  options:
  - `cover` — Covers both width/height by cropping/clipping to fit
  - `contain` — Contain within both width/height using "letterboxing" as needed
  - `inside` — Resize to be as large as possible, ensuring dimensions are less than or equal to the requested width and
    height
  - `outside` — Resize to be as small as possible, ensuring dimensions are greater than or equal to the requested width
    and height
- **`width`** — The **width** of the thumbnail in pixels
- **`height`** — The **height** of the thumbnail in pixels
- **`quality`** — The optional **quality** of the thumbnail (`1` to `100`)
- **`withoutEnlargement`** — Disable image up-scaling
- **`format`** — What file format to return the thumbnail in. One of `auto`, `jpg`, `png`, `webp`, `tiff`
  - `auto` — Will try to format it in `webp` or `avif` if the browser supports it, otherwise it will fallback to `jpg`.

### Advanced Transformations

For even more advanced control over the file generation, Directus exposes
[the full `sharp` API](https://sharp.pixelplumbing.com/api-operation) through the `transforms` query parameter. This
parameter accepts a two-dimensional array with the format `[Operation, ...arguments]`.

<!-- ### Cover vs Contain

For easier comparison, both of the examples below were requested at `200` width, `200` height, and `75` quality. The
`cover` thumbnail forces the dimensions, trimming the outside edges as needed. The `contain` thumbnail always maintains
its aspect ratio, shrinking the image to fit _within_ the dimensions and adding "letterboxing" as needed.

| Cover                                                       | Contain                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| ![Cover](../assets/200-200-cover-75.jpg)<br>_8KB • 200x200_ | ![Contain](../assets/200-200-contain-75.jpg)<br>_6KB • 200x133_ |

::: tip Aspect Ratio

Images are never stretched or distorted even when changing the aspect ratio.

::: -->

### Quality vs File Size

The quality parameter can be any integer from `0-100`. Qualities closer to `0` have lower file sizes, but also poor
image quality due to compression artifacts. Values closer to `100` have larger file sizes, but better image quality.
Below are four possible qualities (200x200 cover) to visually compare the balance between compression and file size.

| 25%                                                                                             | 50%                                                                                             | 75%                                                                                             | 100%                                                                                               |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ![25%](https://cdn.directus.io/docs/v9/reference/files/200-200-cover-25-20220216A.jpg)<br>_4KB_ | ![50%](https://cdn.directus.io/docs/v9/reference/files/200-200-cover-50-20220216A.jpg)<br>_6KB_ | ![75%](https://cdn.directus.io/docs/v9/reference/files/200-200-cover-75-20220216A.jpg)<br>_8KB_ | ![100%](https://cdn.directus.io/docs/v9/reference/files/200-200-cover-100-20220216A.jpg)<br>_38KB_ |

### Preset

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
GET /assets/<file-id>?key=<key>
```

</template>
<template #graphql>

Not supported by GraphQL

</template>
<template #sdk>

```js
import { createDirectus, rest, readAssetRaw } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readAssetRaw('<file-id>', { key: '<key>' }));
```

</template>
</SnippetToggler>

### Custom

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
GET /assets/<file-id>?fit=<fit>&width=<width>&height=<height>&quality=<quality>
```

</template>
<template #graphql>

Not supported by GraphQL

</template>
<template #sdk>

```js
import { createDirectus, rest, readAssetRaw } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readAssetRaw('1ac73658-8b62-4dea-b6da-529fbc9d01a4', {
	fit: '<fit>',
	width: <width>,
	height: <height>,
	quality: <quality>,
}));
```

</template>
</SnippetToggler>

### Advanced

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
GET /assets/<file-id>?transforms=[
	["blur", 45],
	["tint", "rgb(255, 0, 0)"],
	["expand", { "right": 200, "bottom": 150 }]
]
```

</template>
<template #graphql>

Not supported by GraphQL

</template>
<template #sdk>

```js
import { createDirectus, rest, readAssetRaw } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readAssetRaw('1ac73658-8b62-4dea-b6da-529fbc9d01a4', {
	transforms: [
		["blur", 45],
		["tint", "rgb(255, 0, 0)"],
		["expand", { "right": 200, "bottom": 150 }]
	]
}));
```

</template>
</SnippetToggler>

### Focal Points

Directus will crop assets when requested with a `width` or `height` query parameter. By default, images are cropped
around the center of the image. If `focal_point_x` and `focal_point_y` values are stored in the file object, cropping
will center around these coordinates.

## The File Object

`id` **uuid**\
Primary key of the file

`storage` **string**\
Storage adapter used for the file.

`filename_disk` **string**\
Name of the file as saved on the storage adapter.

`filename_download` **string**\
Preferred filename when file is downloaded.

`title` **string**\
Title for the file.

`type` **string**\
Mimetype of the file.

`folder` **many-to-one**\
What (virtual) folder the file is in. Many-to-one to [folders](/reference/system/folders).

`created_on` **datetime**\
When the file was created.

`uploaded_by` **many-to-one**\
Who uploaded the file. Many-to-one to [users](/reference/system/users).

`uploaded_on` **datetime**\
When the file was last uploaded/replaced.

`modified_by` **many-to-one**\
Who updated the file last. Many-to-one to [users](/reference/system/users).

`filesize` **number**\
Size of the file in bytes.

`width` **number**\
If the file is a(n) image/video, it's the width in px.\
This property is only auto-extracted for images.

`height` **number**\
If the file is a(n) image/video, it's the height in px.\
This property is only auto-extracted for images.

`focal_point_x` **number**\
If the file is an image, cropping will center around this point.

`focal_point_y` **number**\
If the file is an image, cropping will center around this point.

`duration` **number**\
If the file contains audio/video, it's the duration in milliseconds.\
This property is not auto-extracted.

`description` **string**\
Description of the file.

`location` **string**\
Location of the file.

`tags` **array**\
Tags for the file.

`metadata` **object**\
Any additional metadata Directus was able to scrape from the file. For images, this includes Exif, IPTC, and ICC information.

```json
{
	"id": "4f4b14fa-a43a-46d0-b7ad-90af5919bebb",
	"storage": "local",
	"filename_disk": "4f4b14fa-a43a-46d0-b7ad-90af5919bebb.jpeg",
	"filename_download": "paulo-silva-vSRgXtQuns8-unsplash.jpg",
	"title": "Paulo Silva (via Unsplash)",
	"type": "image/jpeg",
	"folder": null,
	"created_on": "2021-02-04T11:37:41-05:00",
	"uploaded_by": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07",
	"uploaded_on": "2021-02-04T11:37:41-05:00",
	"modified_by": null,
	"modified_on": "2021-02-04T11:37:42-05:00",
	"filesize": 3442252,
	"width": 3456,
	"height": 5184,
	"focal_point_x": null,
	"focal_point_y": null,
	"duration": null,
	"description": null,
	"location": null,
	"tags": ["photo", "pretty"],
	"metadata": {
		"icc": {
			"version": "2.1",
			"intent": "Perceptual",
			"cmm": "lcms",
			"deviceClass": "Monitor",
			"colorSpace": "RGB",
			"connectionSpace": "XYZ",
			"platform": "Apple",
			"creator": "lcms",
			"description": "c2",
			"copyright": ""
		}
	}
}
```

## List Files

List all files that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /files`

`SEARCH /files`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	files: [directus_files]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFiles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readFiles(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [file objects](#the-file-object). If no items are available, data will
be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /files`

`SEARCH /files`

</template>
<template #graphql>

```graphql
query {
	files {
		id
		filename_disk
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFiles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readFiles({
		filter: {
			type: {
				_eq: 'image',
			},
		},
	})
);
```

</template>
</SnippetToggler>

## Retrieve a File

Retrieve a single file by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /files/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	files_by_id(id: ID!): directus_files
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFiles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readFile(file_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns a [file object](#the-file-object) if a valid primary key was provided.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	files_by_id(id: "0fca80c4-d61c-4404-9fd7-6ba86b64154d") {
		id
		filename_disk
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFiles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readFile('b3000f41-6ce0-4ba3-b362-fb85c9de8579', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Upload a File

Upload a new file.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /files`

Body must be formatted as a `multipart/form-data` with a final property called `file`.

</template>
<template #graphql>

Not supported by GraphQL

</template>
<template #sdk>

```js
import { createDirectus, rest, uploadFiles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const formData = new FormData();
formData.append('file_1_property', 'Value');
formData.append('file', raw_file);
formData.append('file_2_property', 'Value');
formData.append('file', raw_file_2);

const result = await client.request(uploadFiles(formData));
```

</template>
</SnippetToggler>

The file contents has to be provided in a property called `file`. All other properties of
[the file object](#the-file-object) can be provided as well, except `filename_disk` and `filename_download`.

::: tip Order Matters

Make sure to define the non-file properties for each file _first_. This ensures that the file metadata is associated
with the correct file.

:::

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the [file object](#the-file-object) for the uploaded file, or an array of [file objects](#the-file-object) if
multiple files were uploaded at once.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /files`

```http

Content-Type: multipart/form-data; boundary=boundary

--boundary
Content-Disposition: form-data; name="title"

example
--boundary
Content-Disposition: form-data; name="file"; filename="example.txt"

< ./example.txt

--boundary
```

</template>
<template #graphql>

Not supported by GraphQL

</template>
<template #sdk>

#### Web

::: code-group

```js-vue [index.js]
import { createDirectus, rest, uploadFiles } from 'https://unpkg.com/@directus/sdk@{{ packages['@directus/sdk'].version.major }}';

const client = createDirectus('https://directus.example.com').with(rest());

const form = document.getElementById('upload-file');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const result = await client.request(uploadFiles(formData));

    form.reset();
  });
}
```

```html [index.html]
<!doctype html>
<html>
  <head></head>
  <body>
    <form id="upload-file">
      <input type="text" name="title" placeholder="Title..." />
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
    <script src="/index.js" type="module"></script>
  </body>
</html>
```

:::

#### Node.js

```js
import { createDirectus, rest, uploadFiles } from '@directus/sdk';
import { readFileSync } from 'node:fs';

const client = createDirectus('https://directus.example.com').with(rest());

const title = 'Example';
const file = new Blob([readFileSync('example.txt')], { type: 'text/plain' });
const fileName = 'example.txt';

const formData = new FormData();
formData.append('title', title);
formData.append('file', file, fileName);

const result = await client.request(uploadFiles(formData));
```

[Learn more about `FormData` ->](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

</template>
</SnippetToggler>

## Import a File

Import a file from the web

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /files/import`

```json
{
	"url": file_url,
	"data": file_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	import_file(url: String!, data: create_directus_files_input!): directus_files
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, importFile } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(importFile(file_url, file_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`url` **Required**\
The URL to download the file from.

`data`\
Any of [the file object](#the-file-object)'s properties.

### Response

Returns the [file object](#the-file-object) for the imported file.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /files/import`

```json
{
	"url": "https://source.unsplash.com/random",
	"data": {
		"title": "Example"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	import_file(url: "https://source.unsplash.com/random", data: { title: "Example" }) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, importFile } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	importFile('https://upload.wikimedia.org/wikipedia/commons/c/ca/Entlebucher.jpg', {
		title: 'Dog',
	})
);
```

</template>
</SnippetToggler>

## Update a File

Update an existing file, and/or replace it's file contents.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /files/:id`

Provide a partial [file object](#the-file-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_files_item(id: ID!, data: update_directus_files_input!): directus_files
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFile } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateFile(file_id, partial_file_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

You can either submit a JSON object consisting of a partial [file object](#the-file-object) to update the file meta, or
send a multipart/form-data request to replace the file contents on disk. See [Upload a File](#upload-a-file) for more
information on the structure of this `multipart/form-data` request.

### Response

Returns the [file object](#the-file-object) for the updated file.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d`

```json
{
	"title": "Example"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_files_item(id: "0fca80c4-d61c-4404-9fd7-6ba86b64154d", data: { title: "Example" }) {
		id
		title
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFile } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateFile('dc193671-13b9-4c37-a8af-42f17c036742', {
		title: 'Entlebucher Mountain Dog',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Files

Update multiple files at the same time.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /files`

```json
{
	"keys": file_id_array ,
	"data": partial_file_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_files_items(ids: [ID!]!, data: update_directus_files!): [directus_files]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFiles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateFiles(file_id_array, partial_file_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the files you'd like to update.

`data` **Required**\
Any of [the file object](#the-file-object)'s properties.

### Response

Returns the [file objects](#the-file-object) for the updated files.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /files`

```json
{
	"keys": ["b6123925-2fc0-4a30-9d86-863eafc0a6e7", "d17c10aa-0bad-4864-9296-84f522c753e5"],
	"data": {
		"tags": ["cities"]
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_files_items(
		ids: ["b6123925-2fc0-4a30-9d86-863eafc0a6e7", "d17c10aa-0bad-4864-9296-84f522c753e5"]
		data: { tags: ["cities"] }
	)
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFiles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateFiles(['dc193671-13b9-4c37-a8af-42f17c036742', 'e88b0344-84cf-4bfd-a90b-c0b5b66c17eb'], {
		tags: ['dogs'],
	})
);
```

</template>
</SnippetToggler>

## Delete a File

Delete an existing file.

::: danger Destructive

This will also delete the file from disk.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /files/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_files_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFile } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteFile(file_id));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Empty response.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_files_item(id: "0fca80c4-d61c-4404-9fd7-6ba86b64154d") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFile } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteFile('b3000f41-6ce0-4ba3-b362-fb85c9de8579'));
```

</template>
</SnippetToggler>

## Delete Multiple Files

Delete multiple files at once.

::: danger Destructive

This will also delete the files from disk.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /files`

Provide an array of file IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_files_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFiles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteFiles(file_id_array));

//or

const result = await client.request(deleteFiles(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

Array of file primary keys

### Returns

Empty response.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /files`

```json
["d17c10aa-0bad-4864-9296-84f522c753e5", "b6123925-2fc0-4a30-9d86-863eafc0a6e7"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_files_items(ids: ["d17c10aa-0bad-4864-9296-84f522c753e5", "b6123925-2fc0-4a30-9d86-863eafc0a6e7"]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFiles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteFiles(['90a416f0-28e0-4d51-84a2-387d1789add9', '840e2f08-d5cd-4caa-ac0a-31363626efb4'])
);

// or

const result = await client.request(
	deleteFiles({
		filter: {
			type: {
				_eq: 'image/jpeg',
			},
		},
	})
);
```

</template>
</SnippetToggler>
