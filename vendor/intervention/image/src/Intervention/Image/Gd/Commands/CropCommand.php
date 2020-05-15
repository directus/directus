<?php

namespace Intervention\Image\Gd\Commands;

use Intervention\Image\Point;
use Intervention\Image\Size;

class CropCommand extends ResizeCommand
{
    /**
     * Crop an image instance
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $width = $this->argument(0)->type('digit')->required()->value();
        $height = $this->argument(1)->type('digit')->required()->value();
        $x = $this->argument(2)->type('digit')->value();
        $y = $this->argument(3)->type('digit')->value();

        if (is_null($width) || is_null($height)) {
            throw new \Intervention\Image\Exception\InvalidArgumentException(
                "Width and height of cutout needs to be defined."
            );
        }

        $cropped = new Size($width, $height);
        $position = new Point($x, $y);

        // align boxes
        if (is_null($x) && is_null($y)) {
            $position = $image->getSize()->align('center')->relativePosition($cropped->align('center'));
        }

        // crop image core
        return $this->modify($image, 0, 0, $position->x, $position->y, $cropped->width, $cropped->height, $cropped->width, $cropped->height);
    }
}
