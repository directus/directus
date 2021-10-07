# Thumbnail Transformations

Our file middleware also allows for cropping and transforming image assets on the fly. This means you can simply request
an image, include any desired transformation parameters, and you'll be served the new asset as a response. This is very
useful for automatically generating many different thumbnails/versions of an original file.

To impede malicious users from consuming your storage by requesting a multitude of random sizes, Directus includes a
[Asset Allow-List](/guides/files/#creating-thumbnail-presets) to limit what transformations are possible.
