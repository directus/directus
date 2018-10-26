<?php

namespace Intervention\Image\Imagick\Commands;

class LimitColorsCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Reduces colors of a given image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $count = $this->argument(0)->value();
        $matte = $this->argument(1)->value();

        // get current image size
        $size = $image->getSize();

        // build 2 color alpha mask from original alpha
        $alpha = clone $image->getCore();
        $alpha->separateImageChannel(\Imagick::CHANNEL_ALPHA);
        $alpha->transparentPaintImage('#ffffff', 0, 0, false);
        $alpha->separateImageChannel(\Imagick::CHANNEL_ALPHA);
        $alpha->negateImage(false);

        if ($matte) {

            // get matte color
            $mattecolor = $image->getDriver()->parseColor($matte)->getPixel();

            // create matte image
            $canvas = new \Imagick;
            $canvas->newImage($size->width, $size->height, $mattecolor, 'png');

            // lower colors of original and copy to matte
            $image->getCore()->quantizeImage($count, \Imagick::COLORSPACE_RGB, 0, false, false);
            $canvas->compositeImage($image->getCore(), \Imagick::COMPOSITE_DEFAULT, 0, 0);

            // copy new alpha to canvas
            $canvas->compositeImage($alpha, \Imagick::COMPOSITE_COPYOPACITY, 0, 0);

            // replace core
            $image->setCore($canvas);

        } else {

            $image->getCore()->quantizeImage($count, \Imagick::COLORSPACE_RGB, 0, false, false);
            $image->getCore()->compositeImage($alpha, \Imagick::COMPOSITE_COPYOPACITY, 0, 0);

        }

        return true;

    }
}
