<?php

namespace Intervention\Image\Imagick\Commands;

use Intervention\Image\Imagick\Color;

class TrimCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Trims away parts of an image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $base = $this->argument(0)->type('string')->value();
        $away = $this->argument(1)->value();
        $tolerance = $this->argument(2)->type('numeric')->value(0);
        $feather = $this->argument(3)->type('numeric')->value(0);

        $width = $image->getWidth();
        $height = $image->getHeight();

        $checkTransparency = false;

        // define borders to trim away
        if (is_null($away)) {
            $away = ['top', 'right', 'bottom', 'left'];
        } elseif (is_string($away)) {
            $away = [$away];
        }

        // lower border names
        foreach ($away as $key => $value) {
            $away[$key] = strtolower($value);
        }

        // define base color position
        switch (strtolower($base)) {
            case 'transparent':
            case 'trans':
                $checkTransparency = true;
                $base_x = 0;
                $base_y = 0;
                break;

            case 'bottom-right':
            case 'right-bottom':
                $base_x = $width - 1;
                $base_y = $height - 1;
                break;

            default:
            case 'top-left':
            case 'left-top':
                $base_x = 0;
                $base_y = 0;
                break;
        }

        // pick base color
        if ($checkTransparency) {
            $base_color = new Color; // color will only be used to compare alpha channel
        } else {
            $base_color = $image->pickColor($base_x, $base_y, 'object');
        }

        // trim on clone to get only coordinates
        $trimed = clone $image->getCore();

        // add border to trim specific color
        $trimed->borderImage($base_color->getPixel(), 1, 1);

        // trim image
        $trimed->trimImage(65850 / 100 * $tolerance);

        // get coordinates of trim
        $imagePage = $trimed->getImagePage();
        list($crop_x, $crop_y) = [$imagePage['x']-1, $imagePage['y']-1];
        // $trimed->setImagePage(0, 0, 0, 0);
        list($crop_width, $crop_height) = [$trimed->width, $trimed->height];

        // adjust settings if right should not be trimed
        if ( ! in_array('right', $away)) {
            $crop_width = $crop_width + ($width - ($width - $crop_x));
        }

        // adjust settings if bottom should not be trimed
        if ( ! in_array('bottom', $away)) {
            $crop_height = $crop_height + ($height - ($height - $crop_y));
        }

        // adjust settings if left should not be trimed
        if ( ! in_array('left', $away)) {
            $crop_width = $crop_width + $crop_x;
            $crop_x = 0;
        }

        // adjust settings if top should not be trimed
        if ( ! in_array('top', $away)) {
            $crop_height = $crop_height + $crop_y;
            $crop_y = 0;
        }

        // add feather
        $crop_width = min($width, ($crop_width + $feather * 2));
        $crop_height = min($height, ($crop_height + $feather * 2));
        $crop_x = max(0, ($crop_x - $feather));
        $crop_y = max(0, ($crop_y - $feather));

        // finally crop based on page
        $image->getCore()->cropImage($crop_width, $crop_height, $crop_x, $crop_y);
        $image->getCore()->setImagePage(0,0,0,0);

        $trimed->destroy();

        return true;
    }
}
