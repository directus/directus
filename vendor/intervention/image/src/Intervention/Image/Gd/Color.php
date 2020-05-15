<?php

namespace Intervention\Image\Gd;

use Intervention\Image\AbstractColor;
use Intervention\Image\Exception\NotSupportedException;

class Color extends AbstractColor
{
    /**
     * RGB Red value of current color instance
     *
     * @var int
     */
    public $r;

    /**
     * RGB Green value of current color instance
     *
     * @var int
     */
    public $g;

    /**
     * RGB Blue value of current color instance
     *
     * @var int
     */
    public $b;

    /**
     * RGB Alpha value of current color instance
     *
     * @var float
     */
    public $a;

    /**
     * Initiates color object from integer
     *
     * @param  int $value
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromInteger($value)
    {
        $this->a = ($value >> 24) & 0xFF;
        $this->r = ($value >> 16) & 0xFF;
        $this->g = ($value >> 8) & 0xFF;
        $this->b = $value & 0xFF;
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
            $this->a = $this->alpha2gd($a);

        } elseif (count($array) == 3) {

            // color array without alpha value
            list($r, $g, $b) = $array;
            $this->a = 0;

        }

        $this->r = $r;
        $this->g = $g;
        $this->b = $b;
    }

    /**
     * Initiates color object from given string
     *
     * @param  string $value
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromString($value)
    {
        if ($color = $this->rgbaFromString($value)) {
            $this->r = $color[0];
            $this->g = $color[1];
            $this->b = $color[2];
            $this->a = $this->alpha2gd($color[3]);
        }
    }

    /**
     * Initiates color object from given R, G and B values
     *
     * @param  int $r
     * @param  int $g
     * @param  int $b
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromRgb($r, $g, $b)
    {
        $this->r = intval($r);
        $this->g = intval($g);
        $this->b = intval($b);
        $this->a = 0;
    }

    /**
     * Initiates color object from given R, G, B and A values
     *
     * @param  int     $r
     * @param  int     $g
     * @param  int     $b
     * @param  float   $a
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromRgba($r, $g, $b, $a = 1)
    {
        $this->r = intval($r);
        $this->g = intval($g);
        $this->b = intval($b);
        $this->a = $this->alpha2gd($a);
    }

    /**
     * Initiates color object from given ImagickPixel object
     *
     * @param  ImagickPixel $value
     * @return \Intervention\Image\AbstractColor
     */
    public function initFromObject($value)
    {
        throw new NotSupportedException(
            "GD colors cannot init from ImagickPixel objects."
        );
    }

    /**
     * Calculates integer value of current color instance
     *
     * @return int
     */
    public function getInt()
    {
        return ($this->a << 24) + ($this->r << 16) + ($this->g << 8) + $this->b;
    }

    /**
     * Calculates hexadecimal value of current color instance
     *
     * @param  string $prefix
     * @return string
     */
    public function getHex($prefix = '')
    {
        return sprintf('%s%02x%02x%02x', $prefix, $this->r, $this->g, $this->b);
    }

    /**
     * Calculates RGB(A) in array format of current color instance
     *
     * @return array
     */
    public function getArray()
    {
        return [$this->r, $this->g, $this->b, round(1 - $this->a / 127, 2)];
    }

    /**
     * Calculates RGBA in string format of current color instance
     *
     * @return string
     */
    public function getRgba()
    {
        return sprintf('rgba(%d, %d, %d, %.2F)', $this->r, $this->g, $this->b, round(1 - $this->a / 127, 2));
    }

    /**
     * Determines if current color is different from given color
     *
     * @param  AbstractColor $color
     * @param  int       $tolerance
     * @return boolean
     */
    public function differs(AbstractColor $color, $tolerance = 0)
    {
        $color_tolerance = round($tolerance * 2.55);
        $alpha_tolerance = round($tolerance * 1.27);

        $delta = [
            'r' => abs($color->r - $this->r),
            'g' => abs($color->g - $this->g),
            'b' => abs($color->b - $this->b),
            'a' => abs($color->a - $this->a)
        ];

        return (
            $delta['r'] > $color_tolerance or
            $delta['g'] > $color_tolerance or
            $delta['b'] > $color_tolerance or
            $delta['a'] > $alpha_tolerance
        );
    }

    /**
     * Convert rgba alpha (0-1) value to gd value (0-127)
     *
     * @param  float $input
     * @return int
     */
    private function alpha2gd($input)
    {
        $oldMin = 0;
        $oldMax = 1;

        $newMin = 127;
        $newMax = 0;

        return ceil(((($input- $oldMin) * ($newMax - $newMin)) / ($oldMax - $oldMin)) + $newMin);
    }
}
