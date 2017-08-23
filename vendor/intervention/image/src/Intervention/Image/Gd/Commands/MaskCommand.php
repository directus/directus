<?php

namespace Intervention\Image\Gd\Commands;

class MaskCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Applies an alpha mask to an image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $mask_source = $this->argument(0)->value();
        $mask_w_alpha = $this->argument(1)->type('bool')->value(false);

        $image_size = $image->getSize();

        // create empty canvas
        $canvas = $image->getDriver()->newImage($image_size->width, $image_size->height, array(0,0,0,0));

        // build mask image from source
        $mask = $image->getDriver()->init($mask_source);
        $mask_size = $mask->getSize();

        // resize mask to size of current image (if necessary)
        if ($mask_size != $image_size) {
            $mask->resize($image_size->width, $image_size->height);
        }

        imagealphablending($canvas->getCore(), false);

        if ( ! $mask_w_alpha) {
            // mask from greyscale image
            imagefilter($mask->getCore(), IMG_FILTER_GRAYSCALE);
        }

        // redraw old image pixel by pixel considering alpha map
        for ($x=0; $x < $image_size->width; $x++) {
            for ($y=0; $y < $image_size->height; $y++) {

                $color = $image->pickColor($x, $y, 'array');
                $alpha = $mask->pickColor($x, $y, 'array');

                if ($mask_w_alpha) {
                    $alpha = $alpha[3]; // use alpha channel as mask
                } else {

                    if ($alpha[3] == 0) { // transparent as black
                        $alpha = 0;
                    } else {

                        // $alpha = floatval(round((($alpha[0] + $alpha[1] + $alpha[3]) / 3) / 255, 2));

                        // image is greyscale, so channel doesn't matter (use red channel)
                        $alpha = floatval(round($alpha[0] / 255, 2));
                    }

                }

                // preserve alpha of original image...
                if ($color[3] < $alpha) {
                    $alpha = $color[3];
                }

                // replace alpha value
                $color[3] = $alpha;

                // redraw pixel
                $canvas->pixel($color, $x, $y);
            }
        }


        // replace current image with masked instance
        $image->setCore($canvas->getCore());

        return true;
    }
}
