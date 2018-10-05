<?php

namespace Intervention\Image\Imagick\Commands;

use Intervention\Image\Image;
use Intervention\Image\Imagick\Decoder;
use Intervention\Image\Imagick\Color;

class FillCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Fills image with color or pattern
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $filling = $this->argument(0)->value();
        $x = $this->argument(1)->type('digit')->value();
        $y = $this->argument(2)->type('digit')->value();

        $imagick = $image->getCore();

        try {
            // set image filling
            $source = new Decoder;
            $filling = $source->init($filling);

        } catch (\Intervention\Image\Exception\NotReadableException $e) {

            // set solid color filling
            $filling = new Color($filling);
        }

        // flood fill if coordinates are set
        if (is_int($x) && is_int($y)) {

            // flood fill with texture
            if ($filling instanceof Image) {

                // create tile
                $tile = clone $image->getCore();

                // mask away color at position
                $tile->transparentPaintImage($tile->getImagePixelColor($x, $y), 0, 0, false);

                // create canvas
                $canvas = clone $image->getCore();

                // fill canvas with texture
                $canvas = $canvas->textureImage($filling->getCore());

                // merge canvas and tile
                $canvas->compositeImage($tile, \Imagick::COMPOSITE_DEFAULT, 0, 0);

                // replace image core
                $image->setCore($canvas);

            // flood fill with color
            } elseif ($filling instanceof Color) {

                // create canvas with filling
                $canvas = new \Imagick;
                $canvas->newImage($image->getWidth(), $image->getHeight(), $filling->getPixel(), 'png');

                // create tile to put on top
                $tile = clone $image->getCore();

                // mask away color at pos.
                $tile->transparentPaintImage($tile->getImagePixelColor($x, $y), 0, 0, false);

                // save alpha channel of original image
                $alpha = clone $image->getCore();

                // merge original with canvas and tile
                $image->getCore()->compositeImage($canvas, \Imagick::COMPOSITE_DEFAULT, 0, 0);
                $image->getCore()->compositeImage($tile, \Imagick::COMPOSITE_DEFAULT, 0, 0);

                // restore alpha channel of original image
                $image->getCore()->compositeImage($alpha, \Imagick::COMPOSITE_COPYOPACITY, 0, 0);
            }

        } else {

            if ($filling instanceof Image) {

                // fill whole image with texture
                $image->setCore($image->getCore()->textureImage($filling->getCore()));

            } elseif ($filling instanceof Color) {

                // fill whole image with color
                $draw = new \ImagickDraw();
                $draw->setFillColor($filling->getPixel());
                $draw->rectangle(0, 0, $image->getWidth(), $image->getHeight());
                $image->getCore()->drawImage($draw);
            }
        }

        return true;
    }
}
