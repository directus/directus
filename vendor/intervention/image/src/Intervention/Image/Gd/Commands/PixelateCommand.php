<?php

namespace Intervention\Image\Gd\Commands;

class PixelateCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Applies a pixelation effect to a given image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $size = $this->argument(0)->type('digit')->value(10);

        return imagefilter($image->getCore(), IMG_FILTER_PIXELATE, $size, true);
    }
}
