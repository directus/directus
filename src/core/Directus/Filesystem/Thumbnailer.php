<?php

namespace Directus\Filesystem;

use function Directus\add_default_thumbnail_dimensions;
use function Directus\filename_put_ext;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Intervention\Image\ImageManagerStatic as Image;
use Exception;
use Imagick;

class Thumbnailer
{

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
     * @param string $path in the form '_/100/100/crop/good/path/to/some-image.jpg'
     *
     * @throws Exception
     */
    public function __construct(Filesystem $main, Filesystem $thumb, array $config, $path = '', array $params)
    {
        try {
            // $this->files = $files;
            $this->filesystem = $main;
            $this->filesystemThumb = $thumb;
            $this->config = $config;
            $this->params = $params;

            $this->thumbnailParams = $this->validateThumbnailParams($path, $params);

            // // check if the original file exists in storage
            if (!$this->filesystem->exists($this->fileName)) {
                throw new Exception($this->fileName . ' does not exist.'); // original file doesn't exist
            }

            $this->validateThumbnailWhitelist($params);

            $otherParams = $params;
            unset($otherParams['width'], $otherParams['height'], $otherParams['fit'], $otherParams['quality']);

            if (count($otherParams) > 0) {
                ksort($otherParams);
                $paramsString = '';
                foreach ($otherParams as $key => $value) {
                    $paramsString .= ',' . substr($key, 0, 1) . $value;
                }
            }

            $this->thumbnailDir = 'w' . $params['width'] . ',h' . $params['height'] . ',f' . $params['fit'] . ',q' . $params['quality'] . $paramsString;
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
            if ($this->filesystemThumb->exists($this->thumbnailDir . '/' . $this->thumbnailFileName)) {
                $img = $this->filesystemThumb->read($this->thumbnailDir . '/' . $this->thumbnailFileName);
            }

            return isset($img) && $img ? $img : null;
        } catch (Exception $e) {
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
            if ($this->filesystemThumb->exists($this->thumbnailDir . '/' . $this->thumbnailFileName)) {
                if (strtolower(pathinfo($this->thumbnailFileName, PATHINFO_EXTENSION)) === 'webp') {
                    return 'image/webp';
                }
                $img = Image::make($this->filesystemThumb->read($this->thumbnailDir . '/' . $this->thumbnailFileName));
                return $img->mime();
            }

            return 'application/octet-stream';
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Replace PDF files with a JPG thumbnail
     * @throws Exception
     * @return string image content
     */
    public function load()
    {
        $content = $this->filesystem->read($this->fileName);
        $ext = pathinfo($this->fileName, PATHINFO_EXTENSION);
        if (Thumbnail::isNonImageFormatSupported($ext)) {
            $content = Thumbnail::createImageFromNonImage($content);
        }
        return Image::make($content);
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
            $options = $this->getSupportedActionOptions($this->$params);

            // open file image resource
            $img = $this->load();

            // crop image
            $img->resize($this->width, $this->height, function ($constraint) {
                $constraint->aspectRatio();
                if (ArrayUtils::get($options, 'preventUpsize')) {
                    $constraint->upsize();
                }
            });

            if (ArrayUtils::get($options, 'resizeCanvas')) {
                $img->resizeCanvas($this->width, $this->height, ArrayUtils::get($options, 'position', 'center'), ArrayUtils::get($options, 'resizeRelative', false), ArrayUtils::get($options, 'canvasBackground', [255, 255, 255, 0]));
            }

            $encodedImg = (string) $img->encode($this->format, ($this->quality ? $this->quality : null));
            $this->filesystemThumb->write($this->thumbnailDir . '/' . $this->thumbnailFileName, $encodedImg);

            return $encodedImg;
        } catch (Exception $e) {
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
            $img = $this->load();

            // resize/crop image
            $img->fit($this->width, $this->height, function ($constraint) {
            }, ArrayUtils::get($options, 'position', 'center'));

            $encodedImg = (string) $img->encode($this->format, ($this->quality ? $this->quality : null));
            $this->filesystemThumb->write($this->thumbnailDir . '/' . $this->thumbnailFileName, $encodedImg);

            return $encodedImg;
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * validate params and file extensions and return it
     *
     * @param string $thumbnailUrlPath
     * @param array $params
     * @throws Exception
     * @return array
     */
    public function validateThumbnailParams($thumbnailUrlPath, $params)
    {
        // cache
        if ($this->thumbnailParams) {
            return $this->thumbnailParams;
        }

        // get URL parts
        // https://docs.directus.io/guides/thumbnailer.html#url-syntax
        $urlSegments = explode('/', $thumbnailUrlPath);

        // pull the env out of the segments
        array_shift($urlSegments);

        // set thumbnail parameters
        $thumbnailParams = [
            'fit' => filter_var($params['fit'], FILTER_SANITIZE_STRING),
            'height' => filter_var($params['height'], FILTER_SANITIZE_NUMBER_INT),
            'quality' => filter_var($params['quality'], FILTER_SANITIZE_STRING),
            'width' => filter_var($params['width'], FILTER_SANITIZE_NUMBER_INT),
        ];

        if ($thumbnailParams['width'] == null || $thumbnailParams['width'] == '') {
            throw new Exception('No width is provided.');
        }
        if ($thumbnailParams['height'] == null || $thumbnailParams['height'] == '') {
            throw new Exception('No height is provided.');
        }
        if ($thumbnailParams['fit'] == null || $thumbnailParams['fit'] == '') {
            throw new Exception('No fit is provided.');
        }
        if ($thumbnailParams['quality'] == null || $thumbnailParams['quality'] == '') {
            throw new Exception('No quality is provided.');
        }

        // make sure filename is valid
        $filename = $urlSegments[1];
        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        $name = pathinfo($filename, PATHINFO_FILENAME);
        if (!$this->isSupportedFileExtension($ext)) {
            throw new Exception('Invalid file extension.');
        }

        // Set thumbnail filename parameters
        $thumbnailParams['fileExt'] = $ext;
        $thumbnailParams['fileName'] = $filename;
        $format = strtolower(ArrayUtils::get($this->params, 'format') ?: $ext);

        if (!$this->isSupportedFileExtension($format)) {
            throw new Exception('Invalid file format.');
        }

        // Check format against image extension
        if (
            $format !== NULL &&
            strtolower($ext) !== $format &&
            !(
                ($format === 'jpeg' || $format === 'jpg') &&
                (strtolower($ext) === 'jpeg' || strtolower($ext) === 'jpg'))
        ) {
            $thumbnailParams['thumbnailFileName'] = $name . '.' . $format;
        } else {
            $thumbnailParams['thumbnailFileName'] = $filename;
        }

        return $thumbnailParams;
    }

    /**
     * validate params against thumbnail whitelist
     *
     * @param array $params
     * @throws Exception
     * @return boolean
     */

    public function validateThumbnailWhitelist($params)
    {
        $userWhitelist = json_decode(ArrayUtils::get($this->getConfig(), 'asset_whitelist'), true);

        $thumbnailWhitelistEnabled = empty($userWhitelist) === false;

        if ($thumbnailWhitelistEnabled) {
            if (is_string($userWhitelist)) {
                $userWhitelist = json_decode($userWhitelist, true);
            }
            $result = false;
            foreach ($userWhitelist as $key => $value) {
                if (
                    $value['width'] == $params['width'] &&
                    $value['height'] == $params['height'] &&
                    $value['fit'] == $params['fit'] &&
                    $value['quality'] == $params['quality']
                ) {
                    $result = true;
                }
            }
            if (!$result) {
                throw new Exception();
            }
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

        return array_merge($this->getDefaultActions(), (array) $actions);
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
            $value = (array) $value;
        }

        return $value;
    }
}
