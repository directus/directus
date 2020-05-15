<?php

namespace Intervention\Image\Gd\Shapes;

use Intervention\Image\AbstractShape;
use Intervention\Image\Gd\Color;
use Intervention\Image\Image;

class EllipseShape extends AbstractShape
{
    /**
     * Width of ellipse in pixels
     *
     * @var int
     */
    public $width = 100;

    /**
     * Height of ellipse in pixels
     *
     * @var int
     */
    public $height = 100;

    /**
     * Create new ellipse instance
     *
     * @param int $width
     * @param int $height
     */
    public function __construct($width = null, $height = null)
    {
        $this->width = is_numeric($width) ? intval($width) : $this->width;
        $this->height = is_numeric($height) ? intval($height) : $this->height;
    }

    /**
     * Draw ellipse instance on given image
     *
     * @param  Image   $image
     * @param  int     $x
     * @param  int     $y
     * @return boolean
     */
    public function applyToImage(Image $image, $x = 0, $y = 0)
    {
        // parse background color
        $background = new Color($this->background);

        if ($this->hasBorder()) {
            // slightly smaller ellipse to keep 1px bordered edges clean
            imagefilledellipse($image->getCore(), $x, $y, $this->width-1, $this->height-1, $background->getInt());

            $border_color = new Color($this->border_color);
            imagesetthickness($image->getCore(), $this->border_width);

            // gd's imageellipse doesn't respect imagesetthickness so i use imagearc with 359.9 degrees here
            imagearc($image->getCore(), $x, $y, $this->width, $this->height, 0, 359.99, $border_color->getInt());
        } else {
            imagefilledellipse($image->getCore(), $x, $y, $this->width, $this->height, $background->getInt());
        }

        return true;
    }
}
