<?php
use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Intervention\Image\ImageManagerStatic as Image;

class Thumbnailer {

    /**
     * Directus app instance
     *
     * @var Directus\Application\Application
     */
    private $app = null;

    /**
     * Thumbnail params extracted from url
     *
     * @var array
     */
    private $thumbnailParams = [];
    
    /**
     * Base directory for thumbnail
     * 
     * @var string
     */
    private $thumbnailDir = null;
    
    /**
     * Thumbnailer config
     * 
     * @var array
     */
    private $configFilePath;

    /**
     * Constructor
     *
     * @param string $thumbnailUrlPath            
     */
    public function __construct( $options = [] )
    {
        try {
            $this->app = Bootstrap::get('app');
            $this->configFilePath = ArrayUtils::get($options, 'configFilePath', __DIR__ . '/config.json');
            $this->thumbnailParams = $this->extractThumbnailParams(ArrayUtils::get($options, 'thumbnailUrlPath'));
                        
            // check if the original file exists in storage
            if (! $this->app->files->exists($this->fileName)) {
                throw new Exception($this->fileName . ' does not exist.'); // original file doesn't exist
            }
            
            // check if file extension is acceptable
            if (! in_array(strtolower($this->fileExt), $this->getAcceptableFileExtensions())) {
                throw new Exception('Invalid file extension');
            }
            
            // check if dimensions are acceptable
            if (! $this->isAcceptableThumbnailDimension($this->width, $this->height)) {
                throw new Exception('Invalid dimensions.');
            }            
            
            $this->thumbnailDir = ArrayUtils::get($this->getConfig(), 'thumbnailDirectory',__DIR__) . '/' . $this->width . '/' . $this->height . ($this->action ? '/' . $action : '') . ($this->quality ? '/' . $this->quality : '');
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
        if( in_array($key, ['thumbnailDir', 'configFilePath'])) {
            return $this->$key;
        }
        
        return ArrayUtils::get($this->thumbnailParams, $key, null);
    }

    /**
     * Crop image and save as thumbnail
     * http://image.intervention.io/api/crop
     *
     * @throws Exception
     * @return string
     */
    public function crop()
    {        
        try {
            // open file a image resource
            $img = Image::make(ArrayUtils::get($this->getConfig(), 'root') . '/' . $this->fileName);
            
            // create directory if needed
            if (! file_exists($this->thumbnailDir)) {
                mkdir($this->thumbnailDir, 0755, true);
            }
            
            // crop image
            $img->crop($this->width, $this->height)->save($this->thumbnailDir . '/' . $this->fileName, ($this->quality ? $this->translateQuality($this->quality) : null));
            
            return $this->thumbnailDir . '/' . $this->fileName;
        }
        
        catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Fit image and save as thumbnail
     * http://image.intervention.io/api/fit
     *
     * @throws Exception
     * @return string
     */
    public function fit()
    {        
        try {            
            // open file a image resource
            $img = Image::make(ArrayUtils::get($this->getConfig(), 'root') . '/' . $this->fileName);
            
            // create directory if needed
            if (! file_exists($this->thumbnailDir)) {
                mkdir($this->thumbnailDir, 0755, true);
            }
            
            // fit image
            $img->fit($this->width, $this->height)->save($this->thumbnailDir . '/' . $this->fileName, ($this->quality ? $this->translateQuality($this->quality) : null));
            
            return $this->thumbnailDir . '/' . $this->fileName;
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
            if (! in_array(ArrayUtils::get($info, 'extension'), $this->getAcceptableFileExtensions())) {
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
        $qualityNumber = 50; // default quality
        
        switch ($qualityText) {
            case 'best':
                $qualityNumber = 100;
                break;
            case 'better':
                $qualityNumber = 75;
                break;
            case 'good':
                $qualityNumber = 50;
                break;
            case 'poor':
                $qualityNumber = 25;
                break;
        }
        
        return $qualityNumber;
    }

    /**
     * Return acceptable image file types
     *
     * @return array
     */
    public function getAcceptableFileExtensions()
    {
        return ArrayUtils::get($this->getConfig(), 'acceptableFileExtensions');
    }
    
    /**
     * Check if given dimension is acceptable
     * 
     * @param int $width
     * @param int $height
     * @return boolean
     */
    public function isAcceptableThumbnailDimension($width, $height) 
    {
        return in_array($width . 'x' . $height, $this->getAcceptableThumbnailDimensions());
    }
    
    /**
     * Return acceptable thumbnail file dimesions
     * 
     * @return array
     */
    public function getAcceptableThumbnailDimensions()
    {
        return ArrayUtils::get($this->getConfig(), 'acceptableThumbnailDimensions');
    }
    
    /**
     * Merge file and thumbnailer config settings and return
     * 
     * @throws Exception
     * @return array
     */
    public function getConfig()
    {
        try {            
            $config = json_decode(file_get_contents($this->configFilePath), true);
            
            return array_merge($this->app->files->getConfig(), $config);
        }
        
        catch (Exception $e) {
            throw $e;
        }
    }
}