<?php

namespace Intervention\Image;

use Intervention\Image\Exception\InvalidArgumentException;
use Intervention\Image\Exception\NotSupportedException;

abstract class AbstractEncoder
{
    /**
     * Buffer of encode result data
     *
     * @var string
     */
    public $result;

    /**
     * Image object to encode
     *
     * @var Image
     */
    public $image;

    /**
     * Output format of encoder instance
     *
     * @var string
     */
    public $format;

    /**
     * Output quality of encoder instance
     *
     * @var int
     */
    public $quality;
    
    /**
     * Processes and returns encoded image as JPEG string
     *
     * @return string
     */
    abstract protected function processJpeg();

    /**
     * Processes and returns encoded image as PNG string
     *
     * @return string
     */
    abstract protected function processPng();

    /**
     * Processes and returns encoded image as GIF string
     *
     * @return string
     */
    abstract protected function processGif();

    /**
     * Processes and returns encoded image as TIFF string
     *
     * @return string
     */
    abstract protected function processTiff();

    /**
     * Processes and returns encoded image as BMP string
     *
     * @return string
     */
    abstract protected function processBmp();

    /**
     * Processes and returns encoded image as ICO string
     *
     * @return string
     */
    abstract protected function processIco();

    /**
     * Processes and returns image as WebP encoded string
     *
     * @return string
     */
    abstract protected function processWebp();

    /**
     * Process a given image
     *
     * @param  Image   $image
     * @param  string  $format
     * @param  int     $quality
     * @return Image
     */
    public function process(Image $image, $format = null, $quality = null)
    {
        $this->setImage($image);
        $this->setFormat($format);
        $this->setQuality($quality);

        switch (strtolower($this->format)) {

            case 'data-url':
                $this->result = $this->processDataUrl();
                break;

            case 'gif':
            case 'image/gif':
                $this->result = $this->processGif();
                break;

            case 'png':
            case 'image/png':
            case 'image/x-png':
                $this->result = $this->processPng();
                break;

            case 'jpg':
            case 'jpeg':
            case 'image/jpg':
            case 'image/jpeg':
            case 'image/pjpeg':
                $this->result = $this->processJpeg();
                break;

            case 'tif':
            case 'tiff':
            case 'image/tiff':
            case 'image/tif':
            case 'image/x-tif':
            case 'image/x-tiff':
                $this->result = $this->processTiff();
                break;

            case 'bmp':
            case 'bmp':
            case 'ms-bmp':
            case 'x-bitmap':
            case 'x-bmp':
            case 'x-ms-bmp':
            case 'x-win-bitmap':
            case 'x-windows-bmp':
            case 'x-xbitmap':
            case 'image/ms-bmp':
            case 'image/x-bitmap':
            case 'image/x-bmp':
            case 'image/x-ms-bmp':
            case 'image/x-win-bitmap':
            case 'image/x-windows-bmp':
            case 'image/x-xbitmap':
                $this->result = $this->processBmp();
                break;

            case 'ico':
            case 'image/x-ico':
            case 'image/x-icon':
            case 'image/vnd.microsoft.icon':
                $this->result = $this->processIco();
                break;

            case 'psd':
            case 'image/vnd.adobe.photoshop':
                $this->result = $this->processPsd();
                break;

            case 'webp':
            case 'image/webp':
            case 'image/x-webp':
                $this->result = $this->processWebp();
                break;
                
            default:
                throw new NotSupportedException(
                    "Encoding format ({$format}) is not supported."
                );
        }

        $this->setImage(null);

        return $image->setEncoded($this->result);
    }

    /**
     * Processes and returns encoded image as data-url string
     *
     * @return string
     */
    protected function processDataUrl()
    {
        $mime = $this->image->mime ? $this->image->mime : 'image/png';

        return sprintf('data:%s;base64,%s',
            $mime,
            base64_encode($this->process($this->image, $mime, $this->quality))
        );
    }

    /**
     * Sets image to process
     *
     * @param Image $image
     */
    protected function setImage($image)
    {
        $this->image = $image;
    }

    /**
     * Determines output format
     *
     * @param string $format
     */
    protected function setFormat($format = null)
    {
        if ($format == '' && $this->image instanceof Image) {
            $format = $this->image->mime;
        }

        $this->format = $format ? $format : 'jpg';

        return $this;
    }

    /**
     * Determines output quality
     *
     * @param int $quality
     */
    protected function setQuality($quality)
    {
        $quality = is_null($quality) ? 90 : $quality;
        $quality = $quality === 0 ? 1 : $quality;

        if ($quality < 0 || $quality > 100) {
            throw new InvalidArgumentException(
                'Quality must range from 0 to 100.'
            );
        }

        $this->quality = intval($quality);

        return $this;
    }
}
