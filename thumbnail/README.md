# Directus Thumbnailer 
#### Image thumbnailing system for Directus

The Directus Thumbnailer is an image thumbnailing system which utilizes the Directus framework.  The functionality can summerized in the following steps:
  - User requests a specific thumbnail of a Directus File using a URL syntax.
  - The request is routed through an .htaccess file (or the equivalent on nginx) to the PHP thumbnailer file that checks if the thumbnail exists
  - If it does exist, it's simply returned
  - If it does NOT exist, then we check the Directus Thumbnail Whitelist (listing of allowed thumbnail sizes), generate the thumbnail (using GD Library), and return it
  - For example, `directus.example.com/thumbnail/200/300/crop/best/original-file-name.jpg` will result in a thumbnail that is 200px wide and 300px tall is cropped and created. If you remove the `crop` or `fit` parameter the thumbnail is fit within the bounds (aspect ratio maintained). The image is NEVER stretched. An optional "quality" param is also available, in this case, `best`.
  - The url path will be mirrored when the thumbnail is created.  In the example, `directus.example.com/thumbnail/200/300/crop/best/original-file-name.jpg`, the thumbnail will be created in `thumbnail/200/300/crop/best/original-file-name.jpg`


## Installation & Config
The thumbnailer utilizes the Directus framework as well as Intervention/Image (http://image.intervention.io/) for thumbnail processing.  To get started:
- Install Intervention/Image in the Directus root by running  `composer require intervention/image` 
- Clone the thumbnailer in the Directus root by running `git clone git@github.com:directus/directus-thumbnailer.git`
- Modify settings as needed in. `config.json`
- 
## Examples
The follwing examples can executed by copying the url into the browser.
URL: `directus.example.com/thumbnail/200/300/crop/best/my-file.jpg`
RESULT: Cropped file of best quality.
FILE LOCATION: `thumbnail/200/300/crop/best/my-file.jpg`

URL: `directus.example.com/thumbnail/200/300/my-file.jpg`
RESULT: Cropped/resized file of good quality.
FILE LOCATION: `thumbnail/200/300/my-file.jpg`

URL: `directus.example.com/thumbnail/200/300/fit/my-file.jpg`
RESULT: Cropped/resized file of good quality.
FILE LOCATION: `thumbnail/200/300/fit/my-file.jpg`


## Files
The system consists of the following files:
#### index.php
This is the main controller.  It accepts an http request and uses the thumbnailer to create thumb, or return a `not found` image in the case that one can not be created.
#### config.json
This file contains settings for the thumbnailer, including acceptable file extensions, dimensions and thumbnail location.
#### .htaccess
Redirects to the thumbnailer if a thumbnail can not be found.  
#### Thumbnailer.php (class)
This file contains all the core functionality for the thumbnailer and consists of the following functions:
##### public function __construct( $options = [] )
Constructor.
>**(array) $options['thumbnailUrlPath']** - The (relative) url to the thumbnail. In the example 'http://directus.example.com/thumbnail/200/300/crop/best/original-file-name.jpg', the path would be `200/300/crop/best/original-file-name.jpg`

>**(array) $options['configFilePath']** - Path to the `settings.json` file.  
##### public function __get($key)
PHP magic getter implementation to retrieve extracted thumbnail params as well as other object properties.
>**(string) $key** - Will return either an existing object property, or a `thumbnailParams` setting, i.e - `$thumbnailer->width`   
##### public function crop()
Crops image to dimensions specified in `thumbnailParams`.  Please also see http://image.intervention.io/api/crop.
##### public function fit()
Resizes and crops image to dimensions specified in `thumbnailParams`.  Please also see http://image.intervention.io/api/fit.
##### public function extractThumbnailParams($thumbnailUrlPath)
Extracts dimensions, action, and qualtiy from url.
>**(string) $thumbnailUrlPath** - The (relative) url to the thumbnail. In the example 'http://directus.example.com/thumbnail/200/300/crop/best/original-file-name.jpg', the path would be `200/300/crop/best/original-file-name.jpg`

##### public function translateQuality($qualityText)
Converts a textual quality, i.e - good, to a number used by the crop/fit functions.
>**(string) $qulityText** - Text to be translated to a quality number, i.e - 'good' = 50, 'best' = 100
##### public function getAcceptableFileExtensions()
Returns acceptable file extensions as defined in `config.json`.
##### public function isAcceptableThumbnailDimension($width, $height)
Checks if width and height combination is acceptable, as defined in `config.json`.
>**(int) $width** - Width of requested thumbnail.

>**(int) $height** - Height of requested thumbnail.
##### public function getAcceptableThumbnailDimensions()
Returns acceptable dimensions, as defined in `config.json`
##### public function getConfig()
Returns thumbnailer config merged with Directus file config.

