<?php

namespace Intervention\Image;

abstract class AbstractShape
{
    /**
     * Background color of shape
     *
     * @var string
     */
    public $background;

    /**
     * Border color of current shape
     *
     * @var string
     */
    public $border_color;

    /**
     * Border width of shape
     *
     * @var integer
     */
    public $border_width = 0;

    /**
     * Draws shape to given image on given position
     *
     * @param  Image   $image
     * @param  integer $posx
     * @param  integer $posy
     * @return boolean
     */
    abstract public function applyToImage(Image $image, $posx = 0, $posy = 0);

    /**
     * Set text to be written
     *
     * @param  string $text
     * @return void
     */
    public function background($color)
    {
        $this->background = $color;
    }

    /**
     * Set border width and color of current shape
     *
     * @param  integer $width
     * @param  string  $color
     * @return void
     */
    public function border($width, $color = null)
    {
        $this->border_width = is_numeric($width) ? intval($width) : 0;
        $this->border_color = is_null($color) ? '#000000' : $color;
    }

    /**
     * Determines if current shape has border
     *
     * @return boolean
     */
    public function hasBorder()
    {
        return ($this->border_width >= 1);
    }
}
