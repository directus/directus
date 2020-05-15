<?php

namespace Char0n\FFMpegPHP;

/**
 * AnimatedGif represents an animated gif object.
 *
 * This class in implemented in rather un-orthodox way.
 * Reason is that ffmpeg doesn't provide satisfactory
 * quality and compression of animated gifs.
 *
 * Code fragments used from:  GIFEncoder Version 2.0 by László Zsidi
 */
class AnimatedGif implements \Serializable
{

    /**
     * Location in the filesystem where the animated gif will be written.
     *
     * @var string
     */
    protected $outFilePath;
    /**
     * Width of the animated gif.
     *
     * @var int
     */
    protected $width;
    /**
     * Height of the animated gif.
     *
     * @var int
     */
    protected $height;
    /**
     * Frame rate of the animated gif in frames per second.
     *
     * @var int
     */
    protected $frameRate;
    /**
     * Number of times to loop the animation. Put a zero here to loop forever or omit this parameter to disable looping.
     *
     * @var int
     */
    protected $loopCount;
    /**
     * Binary data of gif files to create animation.
     *
     * @var array
     */
    protected $frames;
    /**
     * Gif binary data of animation.
     *
     * @var string
     */
    protected $gifData;
    /**
     * Counter of first animation.
     *
     * @var mixed
     */
    protected $counter;

    /**
     * Create a new AnimatedGif object.
     *
     * @param string $outFilePath Location in the filesystem where the animated gif will be written.
     * @param int    $width       Width of the animated gif.
     * @param int    $height      Height of the animated gif.
     * @param int    $frameRate   Frame rate of the animated gif in frames per second.
     * @param int    $loopCount   Number of times to loop the animation. Put a zero here to loop forever or omit this
     *                            parameter to disable looping.
     */
    public function __construct($outFilePath, $width, $height, $frameRate, $loopCount)
    {
        $this->outFilePath = $outFilePath;
        $this->width = $width;
        $this->height = $height;
        $this->frameRate = $frameRate;
        $this->loopCount = ($loopCount < -1) ? 0 : $loopCount;
        $this->frames = [];
        $this->counter = -1;
    }

    /**
     * Add a frame to the end of the animated gif.
     *
     * @param Frame $frame Frame to add.
     */
    public function addFrame(Frame $frame)
    {
        $tmpFrame = clone $frame;
        $tmpFrame->resize($this->width, $this->height);
        ob_start();
        imagegif($tmpFrame->toGDImage());
        $this->frames[] = ob_get_clean();
        $tmpFrame = null;
    }

    /**
     * Adding header to the animation.
     *
     * @return void
     */
    protected function addGifHeader()
    {
        if (ord($this->frames[0]{10}) & 0x80) {
            $cMap = 3 * (2 << (ord($this->frames[0]{10}) & 0x07));

            $this->gifData = 'GIF89a';
            $this->gifData .= substr($this->frames[0], 6, 7);
            $this->gifData .= substr($this->frames[0], 13, $cMap);
            $this->gifData .= "!\377\13NETSCAPE2.0\3\1".$this->getGifWord($this->loopCount)."\0";
        }
    }

    /**
     * Adding frame binary data to the animation.
     *
     * @param int $i Index of frame from AnimatedGif::frame array.
     * @param int $d Delay (5 seconds = 500 delay units).
     *
     * @return void
     */
    protected function addFrameData($i, $d)
    {
        $dis = 2;
        $col = 0;

        $localsString = 13 + 3 * (2 << (ord($this->frames[$i]{10}) & 0x07));
        $localsEnd = strlen($this->frames[$i]) - $localsString - 1;
        $localsTmp = substr($this->frames[$i], $localsString, $localsEnd);

        $globalLength = 2 << (ord($this->frames[0]{10}) & 0x07);
        $localsLength = 2 << (ord($this->frames[$i]{10}) & 0x07);

        $globalRbg = substr($this->frames[0], 13, 3 * (2 << (ord($this->frames[0]{10}) & 0x07)));
        $localsRgb = substr($this->frames[$i], 13, 3 * (2 << (ord($this->frames[$i]{10}) & 0x07)));

        $localsExt = "!\xF9\x04".chr(($dis << 2) + 0).chr(($d >> 0) & 0xFF).chr(($d >> 8) & 0xFF)."\x0\x0";

        $localsImg = null;

        if ($col > -1 && ord($this->frames[$i]{10}) & 0x80) {
            for ($j = 0; $j < (2 << (ord($this->frames[$i]{10}) & 0x07)); $j++) {
                if (ord($localsRgb{3 * $j + 0}) === (($col >> 16) & 0xFF)
                    && ord($localsRgb{3 * $j + 1}) === (($col >> 8) & 0xFF)
                    && ord($localsRgb{3 * $j + 2}) === (($col >> 0) & 0xFF)
                ) {
                    $localsExt = "!\xF9\x04".chr(($dis << 2) + 1).chr(($d >> 0) & 0xFF).chr(($d >> 8) & 0xFF).chr(
                            $j
                        )."\x0";
                    break;
                }
            }
        }
        switch ($localsTmp{0}) {
            case '!':
                $localsImg = substr($localsTmp, 8, 10);
                $localsTmp = substr($localsTmp, 18);
                break;
            case ',':
                $localsImg = substr($localsTmp, 0, 10);
                $localsTmp = substr($localsTmp, 10);
                break;
        }
        if ($this->counter > -1 && ord($this->frames[$i]{10}) & 0x80) {
            if ($globalLength === $localsLength) {
                if ($this->gifBlockCompare($globalRbg, $localsRgb, $globalLength)) {
                    $this->gifData .= ($localsExt.$localsImg.$localsTmp);
                } else {
                    $byte = ord($localsImg{9});
                    $byte |= 0x80;
                    $byte &= 0xF8;
                    $byte |= (ord($this->frames[0]{10}) & 0x07);
                    $localsImg{9} = chr($byte);
                    $this->gifData .= ($localsExt.$localsImg.$localsRgb.$localsTmp);
                }
            } else {
                $byte = ord($localsImg{9});
                $byte |= 0x80;
                $byte &= 0xF8;
                $byte |= (ord($this->frames[$i]{10}) & 0x07);
                $localsImg{9} = chr($byte);
                $this->gifData .= ($localsExt.$localsImg.$localsRgb.$localsTmp);
            }
        } else {
            $this->gifData .= ($localsExt.$localsImg.$localsTmp);
        }
        $this->counter = 1;
    }

    /**
     * Adding footer to the animation.
     *
     * @return void
     */
    protected function addGifFooter()
    {
        $this->gifData .= ';';
    }

    /**
     * Gif integer wrapper.
     *
     * @param int $int
     *
     * @return string
     */
    protected function getGifWord($int)
    {

        return (chr($int & 0xFF).chr(($int >> 8) & 0xFF));
    }

    /**
     * Gif compare block.
     *
     * @param string $globalBlock
     * @param string $localBlock
     * @param int    $len
     *
     * @return bool
     */
    protected function gifBlockCompare($globalBlock, $localBlock, $len)
    {
        for ($i = 0; $i < $len; $i++) {
            if ($globalBlock{3 * $i + 0} !== $localBlock{3 * $i + 0} ||
                $globalBlock{3 * $i + 1} !== $localBlock{3 * $i + 1} ||
                $globalBlock{3 * $i + 2} !== $localBlock{3 * $i + 2}
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Saving animated gif to remote file.
     *
     * @return boolean
     */
    public function save()
    {
        // No images to process
        if (0 === count($this->frames)) {
            return false;
        }

        return (boolean)file_put_contents($this->outFilePath, $this->getAnimation(), LOCK_EX);
    }

    /**
     * Getting animation binary data.
     *
     * @return string|boolean
     */
    public function getAnimation()
    {
        // No images to process.
        if (0 === count($this->frames)) {
            return false;
        }

        // Process images as animation.
        $this->addGifHeader();
        for ($i = 0, $frameCount = count($this->frames); $i < $frameCount; $i++) {
            $this->addFrameData($i, 1 / $this->frameRate * 100);
        }
        $this->addGifFooter();

        return $this->gifData;
    }

    /**
     * String representation of an AnimatedGif.
     *
     * @return string The string representation of the object or null.
     */
    public function serialize()
    {
        return serialize(
            [
                $this->outFilePath,
                $this->width,
                $this->height,
                $this->frameRate,
                $this->loopCount,
                $this->gifData,
                $this->frames,
                $this->counter,
            ]
        );
    }

    /**
     * Constructs the AnimatedGif.
     *
     * @param string $serialized The string representation of the object.
     *
     * @return void
     */
    public function unserialize($serialized)
    {
        list(
            $this->outFilePath,
            $this->width,
            $this->height,
            $this->frameRate,
            $this->loopCount,
            $this->gifData,
            $this->frames,
            $this->counter
        ) = unserialize($serialized);
    }
}
