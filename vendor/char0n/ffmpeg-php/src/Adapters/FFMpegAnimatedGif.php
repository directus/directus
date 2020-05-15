<?php

namespace Char0n\FFMpegPHP\Adapters;

use Char0n\FFMpegPHP\AnimatedGif;
use Char0n\FFMpegPHP\Frame;

/**
 * Serves as a compatibility adapter for old ffmpeg-php extension.
 */
class FFMpegAnimatedGif
{
    /**
     * @var AnimatedGif
     */
    protected $adaptee;

    public function __construct($outFilePath, $width, $height, $frameRate, $loopCount)
    {
        $this->adaptee = new AnimatedGif($outFilePath, $width, $height, $frameRate, $loopCount);
    }

    public function addFrame(FFMpegFrame $frame)
    {
        $this->adaptee->addFrame(new Frame($frame->toGDImage(), $frame->getPTS()));
        return $this->adaptee->save();
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
