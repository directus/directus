<?php

namespace Intervention\Image\Gd\Shapes;

use Intervention\Image\AbstractShape;
use Intervention\Image\Gd\Color;
use Intervention\Image\Image;

class PolygonShape extends AbstractShape
{
    /**
     * Array of points of polygon
     *
     * @var int
     */
    public $points;

    /**
     * Create new polygon instance
     *
     * @param array $points
     */
    public function __construct($points)
    {
        $this->points = $points;
    }

    /**
     * Draw polygon on given image
     *
     * @param  Image   $image
     * @param  int     $x
     * @param  int     $y
     * @return boolean
     */
    public function applyToImage(Image $image, $x = 0, $y = 0)
    {
        $background = new Color($this->background);
        imagefilledpolygon($image->getCore(), $this->points, intval(count($this->points) / 2), $background->getInt());
        
        if ($this->hasBorder()) {
            $border_color = new Color($this->border_color);
            imagesetthickness($image->getCore(), $this->border_width);
            imagepolygon($image->getCore(), $this->points, intval(count($this->points) / 2), $border_color->getInt());
        }
    
        return true;
    }
}
