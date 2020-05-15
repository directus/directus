<?php

namespace Intervention\Image\Imagick;

use Intervention\Image\AbstractColor;

class Color extends AbstractColor
{
    /**
     * ImagickPixel containing current color information
     *
     * @var \ImagickPixel
     */
    public $pixel;

    /**
     * Initiates color object from integer
     *
     * @param  int $value
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromInteger($value)
    {
        $a = ($value >> 24) & 0xFF;
        $r = ($value >> 16) & 0xFF;
        $g = ($value >> 8) & 0xFF;
        $b = $value & 0xFF;
        $a = $this->rgb2alpha($a);

        $this->setPixel($r, $g, $b, $a);
    }

    /**
     * Initiates color object from given array
     *
     * @param  array $value
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromArray($array)
    {
        $array = array_values($array);

        if (count($array) == 4) {

            // color array with alpha value
            list($r, $g, $b, $a) = $array;

        } elseif (count($array) == 3) {

            // color array without alpha value
            list($r, $g, $b) = $array;
            $a = 1;
        }

        $this->setPixel($r, $g, $b, $a);
    }

    /**
     * Initiates color object from given string
     *
     * @param  string $value
     *
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromString($value)
    {
        if ($color = $this->rgbaFromString($value)) {
            $this->setPixel($color[0], $color[1], $color[2], $color[3]);
        }
    }

    /**
     * Initiates color object from given ImagickPixel object
     *
     * @param  ImagickPixel $value
     *
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromObject($value)
    {
        if (is_a($value, '\ImagickPixel')) {
            $this->pixel = $value;
        }
    }

    /**
     * Initiates color object from given R, G and B values
     *
     * @param  int $r
     * @param  int $g
     * @param  int $b
     *
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromRgb($r, $g, $b)
    {
        $this->setPixel($r, $g, $b);
    }

    /**
     * Initiates color object from given R, G, B and A values
     *
     * @param  int     $r
     * @param  int     $g
     * @param  int     $b
     * @param  float   $a
     *
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromRgba($r, $g, $b, $a)
    {
        $this->setPixel($r, $g, $b, $a);
    }

    /**
     * Calculates integer value of current color instance
     *
     * @return int
     */
    public function getInt()
    {
        $r = $this->getRedValue();
        $g = $this->getGreenValue();
        $b = $this->getBlueValue();
        $a = intval(round($this->getAlphaValue() * 255));

        return intval(($a << 24) + ($r << 16) + ($g << 8) + $b);
    }

    /**
     * Calculates hexadecimal value of current color instance
     *
     * @param  string $prefix
     *
     * @return string
     */
    public function getHex($prefix = '')
    {
        return sprintf('%s%02x%02x%02x', $prefix,
            $this->getRedValue(),
            $this->getGreenValue(),
            $this->getBlueValue()
        );
    }

    /**
     * Calculates RGB(A) in array format of current color instance
     *
     * @return array
     */
    public function getArray()
    {
        return [
            $this->getRedValue(),
            $this->getGreenValue(),
            $this->getBlueValue(),
            $this->getAlphaValue()
        ];
    }

    /**
     * Calculates RGBA in string format of current color instance
     *
     * @return string
     */
    public function getRgba()
    {
        return sprintf('rgba(%d, %d, %d, %.2F)',
            $this->getRedValue(),
            $this->getGreenValue(),
            $this->getBlueValue(),
            $this->getAlphaValue()
        );
    }

    /**
     * Determines if current color is different from given color
     *
     * @param  AbstractColor $color
     * @param  int           $tolerance
     * @return boolean
     */
    public function differs(AbstractColor $color, $tolerance = 0)
    {
        $color_tolerance = round($tolerance * 2.55);
        $alpha_tolerance = round($tolerance);

        $delta = [
            'r' => abs($color->getRedValue() - $this->getRedValue()),
            'g' => abs($color->getGreenValue() - $this->getGreenValue()),
            'b' => abs($color->getBlueValue() - $this->getBlueValue()),
            'a' => abs($color->getAlphaValue() - $this->getAlphaValue())
        ];

        return (
            $delta['r'] > $color_tolerance or
            $delta['g'] > $color_tolerance or
            $delta['b'] > $color_tolerance or
            $delta['a'] > $alpha_tolerance
        );
    }

    /**
     * Returns RGB red value of current color
     *
     * @return int
     */
    public function getRedValue()
    {
        return intval(round($this->pixel->getColorValue(\Imagick::COLOR_RED) * 255));
    }

    /**
     * Returns RGB green value of current color
     *
     * @return int
     */
    public function getGreenValue()
    {
        return intval(round($this->pixel->getColorValue(\Imagick::COLOR_GREEN) * 255));
    }

    /**
     * Returns RGB blue value of current color
     *
     * @return int
     */
    public function getBlueValue()
    {
        return intval(round($this->pixel->getColorValue(\Imagick::COLOR_BLUE) * 255));
    }

    /**
     * Returns RGB alpha value of current color
     *
     * @return float
     */
    public function getAlphaValue()
    {
        return round($this->pixel->getColorValue(\Imagick::COLOR_ALPHA), 2);
    }

    /**
     * Initiates ImagickPixel from given RGBA values
     *
     * @return \ImagickPixel
     */
    private function setPixel($r, $g, $b, $a = null)
    {
        $a = is_null($a) ? 1 : $a;

        return $this->pixel = new \ImagickPixel(
            sprintf('rgba(%d, %d, %d, %.2F)', $r, $g, $b, $a)
        );
    }

    /**
     * Returns current color as ImagickPixel
     *
     * @return \ImagickPixel
     */
    public function getPixel()
    {
        return $this->pixel;
    }

    /**
     * Calculates RGA integer alpha value into float value
     *
     * @param  int $value
     * @return float
     */
    private function rgb2alpha($value)
    {
        // (255 -> 1.0) / (0 -> 0.0)
        return (float) round($value/255, 2);
    }

}
