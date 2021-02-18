# Files

> Directus offers a full Digital Asset Management (DAM) system. This includes multiple storage adapters, nested folder
> organization, private file access, image editing, and on-demand thumbnail generation.

Directus allows you to manage all your files in one place, including documents, images, videos, and more. Files can be
uploaded to the [File Library](/concepts/application/#file-library) in general, or directly to an item via a
[Single File](/guides/field-types/single-file) or [Multiple Files](/guides/field-types/multiple-files) field.

#### Relevant Guides

- [Uploading a File](/guides/files/#uploading-a-file)
- [Accessing an Original File](/guides/files/#accessing-an-original-file)
- [Creating a Thumbnail Preset](/guides/files/#creating-a-thumbnail-preset)
- [Requesting a Thumbnail](/guides/files/#requesting-a-thumbnail)

## File Fields

Directus ships with a full-featured system for digital asset management, with the following fields:

- **Title** — Pulled from the file metadata if available, falls back to a formatted version of the filename
- **Description** — Pulled from the file metadata if available
- **Tags** — Pulled from the file metadata if available
- **Location** — Pulled from the file metadata if available
- **Storage** — The storage adapter where the asset is saved (readonly)
- **Filename Disk** — The actual name of the file within the storage adapter
- **Filename Download** — The name used when downloading the file via _Content-Disposition_

The sidebar's info component also includes the following readonly details:

- **Type** — The MIME type of the file, displayed in the App as a formatted media type
- **Dimensions** — (Images Only) The width and height of the image in pixels
- **Size** — The file-size the asset takes up within the storage adapter
- **Created** — The timestamp of when the file was uploaded to the project
- **Owner** — The Directus user that uploaded the file to the project
- **Folder** — The current parent folder that contains the file
- **Metadata** — Metadata JSON dump of the file's EXIF, IPTC, and ICC information

## Storage Adapters

Storage adapters allow project files to be stored in different locations or services. By default, Directus includes the
following adapters:

- **Local Filesystem** — The default, any filesystem location or network-attached storage
- **S3 or Equivalent** — Including AWS S3, DigitalOcean Spaces, Alibaba OSS, and others
- **Google Cloud Storage** — A RESTful web service on the Google Cloud Platform
- **Azure Blob Storage** — Azure storage account containers

## Thumbnail Transformations

Our file middleware also allows for cropping and transforming image assets on the fly. This means you can simply request
an image, include any desired transformation parameters, and you'll be served the new asset as a response. This is very
useful for automatically generating many different thumbnails/versions of an original file.

To impede malicious users from consuming your storage by requesting a multitude of random sizes, Directus includes a
[Asset Allow-List](/guides/files/#creating-thumbnail-presets) to limit what transformations are possible.

#### Relevant Guides

- [Requesting a Thumbnail](/guides/files/#requesting-a-thumbnail)
