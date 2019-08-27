<?php

namespace Char0n\FFMpegPHP\Adapters;

use Char0n\FFMpegPHP\Frame;

/**
 * Serves as a compatibility adapter for old ffmpeg-php extension.
 */
class FFMpegFrame
{
    /**
     * @var Frame
     */
    protected $adaptee;

    public function __construct($gdImage, $pts = 0.0)
    {
        $this->adaptee = new Frame($gdImage, $pts);
    }

    public function getWidth()
    {
        return $this->adaptee->getWidth();
    }

    public function getHeight()
    {
        return $this->adaptee->getHeight();
    }

    public function getPTS()
    {
        return $this->adaptee->getPTS();
    }

    public function getPresentationTimestamp()
    {
        return $this->adaptee->getPresentationTimestamp();
    }

    public function resize($width, $height, $cropTop = 0, $cropBottom = 0, $cropLeft = 0, $cropRight = 0)
    {
        $this->adaptee->resize($width, $height, $cropTop, $cropBottom, $cropLeft, $cropRight);
    }

    public function crop($cropTop, $cropBottom = 0, $cropLeft = 0, $cropRight = 0)
    {
        $this->adaptee->crop($cropTop, $cropBottom, $cropLeft, $cropRight);
    }

    public function toGDImage()
    {
        return $this->adaptee->toGDImage();
    }

    public function __clone()
    {
        $this->adaptee = clone $this->adaptee;
    }

    public function __destruct()
    {
        $this->adaptee = null;
    }
}
