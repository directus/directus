<?php

namespace Directus\Filesystem;

use function Directus\add_default_thumbnail_dimensions;
use function Directus\filename_put_ext;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
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
     * Main Filesystem
     *
     * @var Filesystem
     */
    private $filesystem;

    /**
     * Main Filesystem
     *
     * @var Filesystem
     */
    private $filesystemThumb;

    /**
     * Thumbnailer config
     *
     * @var array
     */
    private $config = [];

    /**
     * Constructor
     *
     * @param Filesystem $main
     * @param Filesystem $thumb
     * @param array $config
     * @param string $path in the form '_/100/100/crop/good/some-image.jpg'
     *
     * @throws Exception
     */
    public function __construct(Filesystem $main, Filesystem $thumb, array $config, $path = '')
    {
        try {
            // $this->files = $files;
            $this->filesystem = $main;
            $this->filesystemThumb = $thumb;
            $this->config = $config;

            $this->thumbnailParams = $this->extractThumbnailParams($path);

            // check if the original file exists in storage
            if (! $this->filesystem->exists($this->fileName)) {
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

            // relative to configuration['storage']['thumb_root']
            $this->thumbnailDir = $this->width . '/' . $this->height . ($this->action ? '/' . $this->action : '') . ($this->quality ? '/' . $this->quality : '');
        } catch (Exception $e) {
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
            if( $this->filesystemThumb->exists($this->thumbnailDir . '/' . $this->fileName) ) {
                $img = $this->filesystemThumb->read($this->thumbnailDir . '/' . $this->fileName);
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
            if( $this->filesystemThumb->exists($this->thumbnailDir . '/' . $this->fileName) ) {
                $img = Image::make($this->filesystemThumb->read($this->thumbnailDir . '/' . $this->fileName));
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
            $img = Image::make($this->filesystem->read($this->fileName));

            // crop image
            $img->resize($this->width, $this->height, function ($constraint) {
                $constraint->aspectRatio();
            });

            if( ArrayUtils::get($options, 'resizeCanvas')) {
                $img->resizeCanvas($this->width, $this->height, ArrayUtils::get($options, 'position', 'center'), ArrayUtils::get($options, 'resizeRelative', false), ArrayUtils::get($options, 'canvasBackground', [255, 255, 255, 0]));
            }

            $encodedImg = (string) $img->encode(ArrayUtils::get($this->thumbnailParams, 'fileExt'), ($this->quality ? $this->translateQuality($this->quality) : null));
            $this->filesystemThumb->write($this->thumbnailDir . '/' . $this->fileName, $encodedImg);

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
            $img = Image::make($this->filesystem->read($this->fileName));

            // resize/crop image
            $img->fit($this->width, $this->height, function($constraint){}, ArrayUtils::get($options, 'position', 'center'));

            $encodedImg = (string) $img->encode(ArrayUtils::get($this->thumbnailParams, 'fileExt'), ($this->quality ? $this->translateQuality($this->quality) : null));
            $this->filesystemThumb->write($this->thumbnailDir . '/' . $this->fileName, $encodedImg);

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

            // pull the env out of the segments
            array_shift($urlSegments);

            if (! $urlSegments) {
                throw new Exception('Invalid thumbnailUrlPath.');
            }

            // pop off the filename
            $fileName = ArrayUtils::pop($urlSegments);

            // make sure filename is valid
            $ext = pathinfo($fileName, PATHINFO_EXTENSION);
            $name = pathinfo($fileName, PATHINFO_FILENAME);
            if (! $this->isSupportedFileExtension($ext)) {
                throw new Exception('Invalid file extension.');
            }

            $thumbnailParams = [
                'fileName' => filename_put_ext($name, $ext),
                'fileExt' => $ext
            ];

            foreach ($urlSegments as $segment) {

                if (! $segment) continue;

                $hasWidth = ArrayUtils::get($thumbnailParams, 'width');
                $hasHeight = ArrayUtils::get($thumbnailParams, 'height');
                // extract width and height
                if ((!$hasWidth || !$hasHeight) && is_numeric($segment)) {
                    if (!$hasWidth) {
                        ArrayUtils::set($thumbnailParams, 'width', $segment);
                    } else if (!$hasHeight) {
                        ArrayUtils::set($thumbnailParams, 'height', $segment);
                    }
                }

                // extract action and quality
                else {
                    if (!ArrayUtils::get($thumbnailParams, 'action')) {
                        ArrayUtils::set($thumbnailParams, 'action', $segment);
                    } else if (!ArrayUtils::get($thumbnailParams, 'quality')) {
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
        $quality = 60;
        if (!is_numeric($qualityText)) {
            $quality = ArrayUtils::get($this->getSupportedQualityTags(), $qualityText, $quality);
        }

        return $quality;
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
        $dimensions =  $this->parseCSV(
            ArrayUtils::get($this->getConfig(), 'thumbnail_dimensions')
        );

        add_default_thumbnail_dimensions($dimensions);

        return $dimensions;
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
        return $this->getActions();
    }

    /**
     * Check if given quality is supported
     *
     * @param $qualityTag
     *
     * @return bool
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
        $defaultQualityTags = [
            'poor' => 25,
            'good' => 50,
            'better' => 75,
            'best' => 100,
        ];

        $qualityTags =  ArrayUtils::get($this->getConfig(), 'thumbnail_quality_tags') ?: [];
        if (is_string($qualityTags)) {
            $qualityTags = json_decode($qualityTags, true);
        }

        return array_merge($defaultQualityTags, $qualityTags);
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
        return ArrayUtils::get($this->getActions(), $action) ?: [];
    }

    /**
     * Returns a list of supported actions
     *
     * @return array
     */
    public function getActions()
    {
        $actions =  ArrayUtils::get($this->getConfig(), 'thumbnail_actions');
        if (is_string($actions) && !empty($actions)) {
            $actions = json_decode($actions, true);
        }

        return array_merge($this->getDefaultActions(), (array)$actions);
    }

    /**
     * Return a list of the default supported actions
     *
     * @return array
     */
    public function getDefaultActions()
    {
        return [
            'contain' => [
                'options' => [
                    'resizeCanvas' => false, // http://image.intervention.io/api/resizeCanvas
                    'position' => 'center',
                    'resizeRelative' => false,
                    'canvasBackground' => 'ccc', // http://image.intervention.io/getting_started/formats
                ]
            ],
            'crop' => [
                'options' => [
                    'position' => 'center', // http://image.intervention.io/api/fit
                ]
            ]
        ];
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

    /**
     * Parse csv string to an array
     *
     * @param string $value
     *
     * @return array
     */
    protected function parseCSV($value)
    {
        if (is_string($value)) {
            $value = StringUtils::csv(
                $value
            );
        } else {
            $value = (array)$value;
        }

        return $value;
    }
}
