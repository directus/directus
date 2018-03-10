<?php
namespace Directus\Filesystem;

use Directus\Util\ArrayUtils;
use Intervention\Image\ImageManagerStatic as Image;
use Exception;

class Thumbnailer {

    /**
     * Thumbnail params extracted from url
     *
     * @var array
     */
    private $thumbnailParams = [];

    /**
     * Files instance
     *
     * @var Directus\Filesystem\Files
     */
    private $files;

    /**
     * Thumbnailer config
     *
     * @var array
     */
    private $config = [];

    /**
     * Constructor
     *
     * @param Directus\Filesystem\Files $files
     * @param Array $config
     * @param string $thumbnailUrlPath
     *            in the form '100\100\crop\good\some-image.jpg'
     */
    public function __construct(\Directus\Filesystem\Files $files, Array $thumbnailerConfig, $thumbnailUrlPath = '')
    {
        try {
            $this->files = $files;
            $this->config = $thumbnailerConfig;
            $this->thumbnailParams = $this->extractThumbnailParams($thumbnailUrlPath);

            // check if the original file exists in storage
            if (! $this->files->exists($this->fileName)) {
                throw new Exception($this->fileName . ' does not exist.'); // original file doesn't exist
            }

            // check if dimensions are supported
            if (! $this->isSupportedThumbnailDimension($this->width, $this->height)) {
                throw new Exception('Invalid dimensions.');
            }

            // check if action is supported
            if ( $this->action && ! $this->isSupportedAction($this->action)) {
                throw new Exception('Invalid action.');
            }

            // check if quality is supported
            if ( $this->quality && ! $this->isSupportedQualityTag($this->quality)) {
                throw new Exception('Invalid quality.');
            }

            // relative to configuration['filesystem']['root']
            $this->thumbnailDir = 'thumbs/' . $this->width . '/' . $this->height . ($this->action ? '/' . $this->action : '') . ($this->quality ? '/' . $this->quality : '');
        }

        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Magic getter for thumbnailParams
     *
     * @param string $key
     * @return string|int
     */
    public function __get($key)
    {
        return ArrayUtils::get($this->thumbnailParams, $key, null);
    }

    /**
     * Return thumbnail as data
     *
     * @throws Exception
     * @return string|null
     */
    public function get()
    {
        try {
            if( $this->files->exists($this->thumbnailDir . '/' . $this->fileName) ) {
                $img = $this->files->read($this->thumbnailDir . '/' . $this->fileName);
            }

            return isset($img) && $img ? $img : null;
        }

        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Get thumbnail mime type
     *
     * @throws Exception
     * @return string
     */
    public function getThumbnailMimeType()
    {
        try {
            if( $this->files->exists($this->thumbnailDir . '/' . $this->fileName) ) {
                $img = Image::make($this->files->read($this->thumbnailDir . '/' . $this->fileName));
                return $img->mime();
            }

            return 'application/octet-stream';
        }

        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Create thumbnail from image and `contain`
     * http://image.intervention.io/api/resize
     * https://css-tricks.com/almanac/properties/o/object-fit/
     *
     * @throws Exception
     * @return string
     */
    public function contain()
    {
        try {
            // action options
            $options = $this->getSupportedActionOptions($this->action);

            // open file image resource
            $img = Image::make($this->files->read($this->fileName));

            // crop image
            $img->resize($this->width, $this->height, function ($constraint) {
                $constraint->aspectRatio();
            });

            if( ArrayUtils::get($options, 'resizeCanvas')) {
                $img->resizeCanvas($this->width, $this->height, ArrayUtils::get($options, 'position', 'center'), ArrayUtils::get($options, 'resizeRelative', false), ArrayUtils::get($options, 'canvasBackground', [255, 255, 255, 0]));
            }

            $encodedImg = (string) $img->encode(ArrayUtils::get($this->thumbnailParams, 'fileExt'), ($this->quality ? $this->translateQuality($this->quality) : null));
            $this->files->write($this->thumbnailDir . '/' . $this->fileName, $encodedImg);

            return $encodedImg;
        }

        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Create thumbnail from image and `crop`
     * http://image.intervention.io/api/fit
     * https://css-tricks.com/almanac/properties/o/object-fit/
     *
     * @throws Exception
     * @return string
     */
    public function crop()
    {
        try {
            // action options
            $options = $this->getSupportedActionOptions($this->action);

            // open file image resource
            $img = Image::make($this->files->read($this->fileName));

            // resize/crop image
            $img->fit($this->width, $this->height, function($constraint){}, ArrayUtils::get($options, 'position', 'center'));

            $encodedImg = (string) $img->encode(ArrayUtils::get($this->thumbnailParams, 'fileExt'), ($this->quality ? $this->translateQuality($this->quality) : null));
            $this->files->write($this->thumbnailDir . '/' . $this->fileName, $encodedImg);

            return $encodedImg;
        }

        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Parse url and extract thumbnail params
     *
     * @param string $thumbnailUrlPath
     * @throws Exception
     * @return array
     */
    public function extractThumbnailParams($thumbnailUrlPath)
    {
        try {
            if ($this->thumbnailParams) {
                return $this->thumbnailParams;
            }

            $urlSegments = explode('/', $thumbnailUrlPath);

            if (! $urlSegments) {
                throw new Exception('Invalid thumbnailUrlPath.');
            }

            // pop off the filename
            $fileName = ArrayUtils::pop($urlSegments);

            // make sure filename is valid
            $info = pathinfo($fileName);
            if (!$this->isSupportedFileExtension(ArrayUtils::get($info, 'extension'))) {
                throw new Exception('Invalid file extension.');
            }

            $thumbnailParams = [
                'fileName' => $fileName,
                'fileExt' => ArrayUtils::get($info, 'extension')
            ];

            foreach ($urlSegments as $segment) {

                if (! $segment) continue;

                // extract width and height
                if (is_numeric($segment)) {

                    if (! ArrayUtils::get($thumbnailParams, 'width')) {
                        ArrayUtils::set($thumbnailParams, 'width', $segment);
                    } else if (! ArrayUtils::get($thumbnailParams, 'height')) {
                        ArrayUtils::set($thumbnailParams, 'height', $segment);
                    }
                }

                // extract action and quality
                else {

                    if (! ArrayUtils::get($thumbnailParams, 'action')) {
                        ArrayUtils::set($thumbnailParams, 'action', $segment);
                    } else if (! ArrayUtils::get($thumbnailParams, 'quality')) {
                        ArrayUtils::set($thumbnailParams, 'quality', $segment);
                    }
                }
            }

            // validate
            if (! ArrayUtils::contains($thumbnailParams, [
                'width',
                'height'
            ])) {
                throw new Exception('No height or width provided.');
            }

            // set default action, if needed
            if (! ArrayUtils::exists($thumbnailParams, 'action')) {
                ArrayUtils::set($thumbnailParams, 'action', null);
            }

            // set quality to null, if needed
            if (! ArrayUtils::exists($thumbnailParams, 'quality')) {
                ArrayUtils::set($thumbnailParams, 'quality', null);
            }

            return $thumbnailParams;
        }

        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Translate quality text to number and return
     *
     * @param string $qualityText
     * @return number
     */
    public function translateQuality($qualityText)
    {
        return ArrayUtils::get($this->getSupportedQualityTags(), $qualityText, 50);
    }

    /**
     * Check if given file extension is supported
     *
     * @param int $ext
     * @return boolean
     */
    public function isSupportedFileExtension($ext)
    {
        return in_array(strtolower($ext), $this->getSupportedFileExtensions());
    }

    /**
     * Return supported image file types
     *
     * @return array
     */
    public function getSupportedFileExtensions()
    {
        return Thumbnail::getFormatsSupported();
    }

    /**
     * Check if given dimension is supported
     *
     * @param int $width
     * @param int $height
     * @return boolean
     */
    public function isSupportedThumbnailDimension($width, $height)
    {
        return in_array($width . 'x' . $height, $this->getSupportedThumbnailDimensions());
    }

    /**
     * Return supported thumbnail file dimesions
     *
     * @return array
     */
    public function getSupportedThumbnailDimensions()
    {
        return ArrayUtils::get($this->getConfig(), 'supportedThumbnailDimensions');
    }

    /**
     * Check if given action is supported
     *
     * @param int $action
     * @return boolean
     */
    public function isSupportedAction($action)
    {
        return ArrayUtils::has($this->getSupportedActions(), $action);
    }

    /**
     * Return supported actions
     *
     * @return array
     */
    public function getSupportedActions()
    {
        return ArrayUtils::get($this->getConfig(), 'supportedActions');
    }

    /**
     * Check if given quality is supported
     *
     * @param int $action
     * @return boolean
     */
    public function isSupportedQualityTag($qualityTag)
    {
        return ArrayUtils::has($this->getSupportedQualityTags(), $qualityTag);
    }

    /**
     * Return supported thumbnail qualities
     *
     * @return array
     */
    public function getSupportedQualityTags()
    {
        return ArrayUtils::get($this->getConfig(), 'supportedQualityTags');
    }

    /**
     * Return supported action options as set in config
     *
     * @param string $action
     *
     * @return array
     */
    public function getSupportedActionOptions($action)
    {
        $options = ArrayUtils::get($this->getConfig(), 'supportedActions.' . $action . '.options', []);

        return is_array($options) ? $options : [];
    }

    /**
     * Merge file and thumbnailer config settings and return
     *
     * @throws Exception
     * @return array
     */
    public function getConfig()
    {
        return $this->config;
    }
}
