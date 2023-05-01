---
description: REST and GraphQL API documentation for file access and management in Directus.
readTime: 10 min read
pageClass: page-reference
---

# Accessing Files

> Every file managed by the platform is uploaded to the configured storage adapter, and its associated metadata is
> tracked within the `directus_files` system collection. Any requested file transformations are handled on the fly, and
> are only saved to storage.

---

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

---

## Downloading a File

To download an asset with the correct filename, you need to add the `?download` query parameter to the request and the
`download` attribute to your anchor tag. This will ensure the appropriate
[Content-Disposition](https://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html) headers are added. Without this, the
download will work on the _same_ domain, however it will have the file's "id" as the filename for cross-origin requests.

### Example

```html
<a href="https://your-directus.com/assets/<file-id>?download" target="_blank" download="Your File.pdf">Download</a>
```

---

## Requesting a Thumbnail

Fetching thumbnails is as easy as adding a `key` query parameter to the original file's URL. In the Admin App, you can
configure different asset presets that control the output of any given image. If a requested thumbnail doesn't yet
exist, it is dynamically generated and immediately returned.

### Preset Transformations

- **`key`** — This **key** of the [Storage Asset Preset](/app/project-settings#files-thumbnails), a shortcut for the
  below parameters

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

```
example.com/assets/<file-id>?key=<key>
```

### Custom

```
example.com/assets/<file-id>?fit=<fit>&width=<width>&height=<height>&quality=<quality>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4?fit=cover&width=200&height=200&quality=80
```

### Advanced

```
?transforms=[
	["blur", 45],
	["tint", "rgb(255, 0, 0)"],
	["expand", { "right": 200, "bottom": 150 }]
]
```

---

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

`uploaded_by` **many-to-one**\
Who uploaded the file. Many-to-one to [users](/reference/system/users).

`uploaded_on` **datetime**\
When the file was uploaded.

`modified_by` **many-to-one**\
Who updated the file last. Many-to-one to [users](/reference/system/users).

`filesize` **number**\
Size of the file in bytes.

`width` **number**\
If the file is a(n) image/video, it's the width in px.

`height` **number**\
If the file is a(n) image/video, it's the height in px.

`duration` **number**\
If the file contains audio/video, it's the duration in milliseconds.

`description` **string**\
Description of the file.

`location` **string**\
Location of the file.

`tags` **array**\
Tags for the file.

`metadata` **object**\
Any additional metadata Directus was able to scrape from the file. For images, this includes EXIF, IPTC, and ICC information.

```json
{
	"id": "4f4b14fa-a43a-46d0-b7ad-90af5919bebb",
	"storage": "local",
	"filename_disk": "4f4b14fa-a43a-46d0-b7ad-90af5919bebb.jpeg",
	"filename_download": "paulo-silva-vSRgXtQuns8-unsplash.jpg",
	"title": "Paulo Silva (via Unsplash)",
	"type": "image/jpeg",
	"folder": null,
	"uploaded_by": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07",
	"uploaded_on": "2021-02-04T11:37:41-05:00",
	"modified_by": null,
	"modified_on": "2021-02-04T11:37:42-05:00",
	"filesize": 3442252,
	"width": 3456,
	"height": 5184,
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

---

## List Files

List all files that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [file objects](#the-file-object). If no items are available, data will
be an empty array.

### REST API

```
GET /files
SEARCH /files
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	files: [directus_files]
}
```

##### Example

```graphql
query {
	files {
		id
		filename_disk
	}
}
```

---

## Retrieve a File

Retrieve a single file by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns a [file object](#the-file-object) if a valid primary key was provided.

### REST API

```
GET /files/:id
```

##### Example

```
GET /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	files_by_id(id: ID!): directus_files
}
```

##### Example

```graphql
query {
	files_by_id(id: "0fca80c4-d61c-4404-9fd7-6ba86b64154d") {
		id
		filename_disk
	}
}
```

## Upload a File

Upload/create a new file.

To upload a file, use `multipart/form-data` as the encoding type. The file contents has to be provided in a part called
`file`. All other properties of [the file object](#the-file-object) can be provided as parts as well, except
`filename_disk` and `filename_download`.

Alternatively, you can use `application/json` with JSON request body to associate metadata to a file that already exists
in the storage. The `type` property will be required to specify the mimetype of that file.

::: tip Order Matters

Make sure to define the non-file properties _first_. This ensures that the file metadata is associated with the correct
file.

:::

You can upload multiple files at a time by repeating the payload with different contents, for example:

```
--__X_BOUNDARY__
Content-Disposition: form-data; name="title"

Example
--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="paulo-silva-vSRgXtQuns8-unsplash.jpg"
Content-Type: image/jpeg

// binary data

--__X_BOUNDARY__
Content-Disposition: form-data; name="title"

Another Title
--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="mae-mu-GFhqNX1gE9E-unsplash.jpg"
Content-Type: image/jpeg

// binary data
```

In JavaScript, this can be achieved using the native `FormData` class:

```js
import axios from 'axios';

const fileInput = document.querySelector('input[type="file"]');
const formData = new FormData();

formData.append('title', 'My First File');
formData.append('file', fileInput.files[0]);

await axios.post('/files', formData);
```

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the [file object](#the-file-object) for the uploaded file, or an array of [file objects](#the-file-object) if
multiple files were uploaded at once.

```
POST /files
```

```
// Request

Content-Type: multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__
Content-Length: 3442422

--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="paulo-silva-vSRgXtQuns8-unsplash.jpg"
Content-Type: image/jpeg

ÿØÿàJFIFHHÿâICC_PROFILElcmsmntrRGB XYZ Ü)9acspAPPLöÖÓ-lcms
descü^cprt\wtpthbkpt|rXYZgXYZ¤bXYZ¸rTRCÌ@gTRCÌ@bTRCÌ@descc2textIXXYZ öÖÓ-XYZ 3¤XYZ o¢8õXYZ b·ÚXYZ $ ¶ÏcurvËÉckö?Q4!ñ)2;FQw]íkpz±|¬i¿}ÓÃé0ÿÿÿÛ
```

---

## Import a File

Import a file from the web

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`url` **Required**\
The URL to download the file from.

`data`\
Any of [the file object](#the-file-object)'s properties.

### Returns

Returns the [file object](#the-file-object) for the imported file.

### REST API

```
POST /files/import
```

##### Example

```json
// POST /files/import

{
	"url": "https://source.unsplash.com/random",
	"data": {
		"title": "Example"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	import_file(url: String!, data: create_directus_files_input!): directus_files
}
```

##### Example

```graphql
mutation {
	import_file(url: "https://source.unsplash.com/random", data: { title: "Example" }) {
		id
	}
}
```

---

## Update a File

Update an existing file, and/or replace it's file contents.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

You can either submit a JSON object consisting of a partial [file object](#the-file-object) to update the file meta, or
send a multipart/form-data request to replace the file contents on disk. See [Upload a File](#upload-a-file) for more
information on the structure of this `multipart/form-data` request.

### Returns

Returns the [file object](#the-file-object) for the updated file.

### REST API

```
PATCH /files/:id
```

##### Example

```json
// PATCH /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d

{
	"title": "Example"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_files_item(id: ID!, data: update_directus_files_input!): directus_files
}
```

##### Example

```graphql
mutation {
	update_files_item(id: "0fca80c4-d61c-4404-9fd7-6ba86b64154d", data: { title: "Example" }) {
		id
		title
	}
}
```

---

## Update Multiple Files

Update multiple files at the same time.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the files you'd like to update.

`data` **Required**\
Any of [the file object](#the-file-object)'s properties.

### Returns

Returns the [file objects](#the-file-object) for the updated files.

### REST API

```
PATCH /files
```

##### Example

```json
// PATCH /files

{
	"keys": ["b6123925-2fc0-4a30-9d86-863eafc0a6e7", "d17c10aa-0bad-4864-9296-84f522c753e5"],
	"data": {
		"tags": ["cities"]
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_files_items(ids: [ID!]!, data: update_directus_files!): [directus_files]
}
```

##### Example

```graphql
mutation {
	update_files_items(
		ids: ["b6123925-2fc0-4a30-9d86-863eafc0a6e7", "d17c10aa-0bad-4864-9296-84f522c753e5"]
		data: { tags: ["cities"] }
	)
}
```

---

## Delete a File

Delete an existing file.

::: danger Destructive

This will also delete the file from disk.

:::

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Empty response.

### REST API

```
DELETE /files/:id
```

##### Example

```
DELETE /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_files_item(id: ID!): delete_one
}
```

```graphql
mutation {
	delete_files_item(id: "0fca80c4-d61c-4404-9fd7-6ba86b64154d") {
		id
	}
}
```

---

## Delete Multiple Files

Delete multiple files at once.

::: danger Destructive

This will also delete the files from disk.

:::

### Request Body

Array of file primary keys

### Returns

Empty response.

### REST API

```
DELETE /files
```

##### Example

```json
// DELETE /files

["d17c10aa-0bad-4864-9296-84f522c753e5", "b6123925-2fc0-4a30-9d86-863eafc0a6e7"]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_files_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_files_items(ids: ["d17c10aa-0bad-4864-9296-84f522c753e5", "b6123925-2fc0-4a30-9d86-863eafc0a6e7"]) {
		ids
	}
}
```
