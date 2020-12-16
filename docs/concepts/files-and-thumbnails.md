# Files & Thumbnails

> Directus offers a full Digital Asset Management (DAM) system. This includes multiple storage
> adapters, nested folder organization, private file access, image editing, and on-demand thumbnail
> generation.

## Storage Adapters

Storage adapters allow project files to be stored in different locations or services. By default,
Directus includes the following adapters:

-   **Local Filesystem** — The default, any filesystem location or network-attached storage
-   **S3 or Equivalent** — Including AWS S3, DigitalOcean Spaces, Alibaba OSS, and others
-   **Google Cloud Storage** — A RESTful web service on the Google Cloud Platform

## Files

Directus allows you to manage all your files in one place, including documents, images, videos, and
more. Files can be uploaded to the [File Library](/concepts/app-overview#file-library) in general,
or directly to an item via a [Single File](/guides/field-types/single-file) or
[Multiple Files](/guides/field-types/multiple-files) field.

### Relevant Guides

-   [Uploading a File](/guides/files#uploading-a-file)
-   [Requesting an Original File](/guides/files#accessing-an-original-file)

## Embedded Assets

Directus also supports ingesting third-party embedded assets, such as YouTube or Vimeo videos. These
are managed the same as normal files, however the resource itself is stored on the external service,
and referenced via its proprietary UID.

## Crop & Transform Images

Our file middleware also allows for cropping and transforming image assets on the fly. This means
you can simply request an image, include any desired transformation parameters, and you'll be served
the new asset as a response. This is very useful for automatically generating many different
thumbnails/versions of an original file.

To impede malicious users from consuming your storage by requesting a multitude of random sizes,
Directus includes a [Asset Allow-List](/guides/files#creating-thumbnail-presets) to limit what
transformations are possible.

### Relevant Guides

-   [Requesting a Thumbnail](/guides/files#requesting-a-thumbnail)
