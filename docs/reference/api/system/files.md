---
pageClass: page-reference
---

# Files

<div class="two-up">
<div class="left">

> Files are the objects that contain information about the file managed through Directus. If you're looking for the
> actual file data, including thumbnails, see the [/assets](/reference/api/assets/) endpoint.
> [Learn more about Files](/concepts/files/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The File Object

<div class="two-up">
<div class="left">
<div class="definitions">

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
What (virtual) folder the file is in. Many-to-one to [folders](/reference/api/system/folders/).

`uploaded_by` **many-to-one**\
Who uploaded the file. Many-to-one to [users](/reference/api/system/users/).

`uploaded_on` **datetime**\
When the file was uploaded.

`modified_by` **many-to-one**\
Who updated the file last. Many-to-one to [users](/reference/api/system/users/).

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

</div>
</div>
<div class="right">

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

</div>
</div>

---

## List Files

List all files that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [file objects](#the-file-object). If no items are available, data
will be an empty array.

</div>
<div class="right">

### REST API

```
GET /files
SEARCH /files
```

[Learn more about SEARCH ->](/reference/api/introduction/#search-http-method)

### GraphQL

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

</div>
</div>

---

## Retrieve a File

Retrieve a single file by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns a [file object](#the-file-object) if a valid primary key was provided.

</div>
<div class="right">

### REST API

```
GET /files/:id
```

##### Example

```
GET /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d
```

### GraphQL

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

</div>
</div>

## Upload a File

Upload/create a new file.

<div class="two-up">
<div class="left">

To upload a file, use `multipart/form-data` as the encoding type, instead of JSON.

The file contents has to to be provided in a part called `file`. All other properties of
[the file object](#the-file-object) can be provided as parts as well.

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

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the [file object](#the-file-object) for the uploaded file, or an array of [file objects](#the-file-object) if
multiple files were uploaded at once.

</div>
<div class="right">

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

</div>
</div>

---

## Import a File

Import a file from the web

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

<div class="definitions">

`url` **Required**\
The URL to download the file from.

`data`\
Any of [the file object](#the-file-object)'s properties.

</div>

### Returns

Returns the [file object](#the-file-object) for the imported file.

</div>
<div class="right">

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

</div>
</div>

---

## Update a File

Update an existing file, and/or replace it's file contents.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

You can either submit a JSON object consisting of a partial [file object](#the-file-object) to update the file meta, or
send a multipart/form-data request to replace the file contents on disk. See [Upload a File](#upload-a-file) for more
information on the structure of this `multipart/form-data` request.

### Returns

Returns the [file object](#the-file-object) for the updated file.

</div>
<div class="right">

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

</div>
</div>

---

## Update Multiple Files

Update multiple files at the same time.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

<div class="definitions">

`keys` **Required**\
Array of primary keys of the files you'd like to update.

`data` **Required**\
Any of [the file object](#the-file-object)'s properties.

</div>

### Returns

Returns the [file objects](#the-file-object) for the updated files.

</div>
<div class="right">

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

</div>
</div>

---

## Delete a File

Delete an existing file.

<div class="two-up">
<div class="left">

::: danger Destructive

This will also delete the file from disk.

:::

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Empty response.

</div>
<div class="right">

### REST API

```
DELETE /files/:id
```

##### Example

```
DELETE /files/0fca80c4-d61c-4404-9fd7-6ba86b64154d
```

### GraphQL

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

</div>
</div>

---

## Delete Multiple Files

Delete multiple files at once.

<div class="two-up">
<div class="left">

::: danger Destructive

This will also delete the files from disk.

:::

### Request Body

Array of file primary keys

### Returns

Empty response.

</div>
<div class="right">

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

</div>
</div>
