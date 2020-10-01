# Files & Thumbnails

> Directus offers a full Digital Asset Management (DAM) system. This includes multiple storage adapters, nested folder organization, private file access, image editing, and on-demand thumbnail generation.

## Storage Adapters

Storage adapters allow project files to be stored in different locations or services. By default, Directus includes the following adapters:

* Local Filesystem — The default, any filesystem location or network-attached storage
* S3 or Equivalent — Including AWS S3, DigitalOcean Spaces, Alibaba OSS, and others
* Google Cloud Storage — A RESTful web service on the Google Cloud Platform

## Files

Directus allows you to manage all your files in one place, including documents, images, videos, and even third-party embedded resources (eg: YouTube). Files can be uploaded to the [File Library](#) in general, or directly to an item via a [Single File](#) or [Multiple Files](#) field.

@TODO private files

### Relevant Guides

* [Requesting an Original File](#)
* [Requesting a Private File](#)

## Crop & Transform Images

Our file middleware also allows for cropping and transforming image assets on the fly. This means you can simply request an image, include any desired transformation parameters, and you'll be served the new asset as a response. This is very useful for automatically generating many different thumbnails/versions of an original file.

To impede malicious users from consuming your storage by requesting a multitude of random sizes, Directus includes a [Thumbnail Allow-List](#) to limit what transformations are possible.

### Relevant Guides

* [Requesting a Thumbnail](#)
* [Allow-Listing Thumbnails](#)
