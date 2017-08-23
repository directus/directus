<?php

namespace Intervention\Image\Gd\Commands;

use Intervention\Image\Gd\Color;

class TrimCommand extends ResizeCommand
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

        // default values
        $checkTransparency = false;

        // define borders to trim away
        if (is_null($away)) {
            $away = array('top', 'right', 'bottom', 'left');
        } elseif (is_string($away)) {
            $away = array($away);
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
            $color = new Color; // color will only be used to compare alpha channel
        } else {
            $color = $image->pickColor($base_x, $base_y, 'object');
        }

        $top_x = 0;
        $top_y = 0;
        $bottom_x = $width;
        $bottom_y = $height;

        // search upper part of image for colors to trim away
        if (in_array('top', $away)) {

            for ($y=0; $y < ceil($height/2); $y++) {
                for ($x=0; $x < $width; $x++) {

                    $checkColor = $image->pickColor($x, $y, 'object');

                    if ($checkTransparency) {
                        $checkColor->r = $color->r;
                        $checkColor->g = $color->g;
                        $checkColor->b = $color->b;
                    }

                    if ($color->differs($checkColor, $tolerance)) {
                        $top_y = max(0, $y - $feather);
                        break 2;
                    }

                }
            }

        }

        // search left part of image for colors to trim away
        if (in_array('left', $away)) {

            for ($x=0; $x < ceil($width/2); $x++) {
                for ($y=$top_y; $y < $height; $y++) {

                    $checkColor = $image->pickColor($x, $y, 'object');

                    if ($checkTransparency) {
                        $checkColor->r = $color->r;
                        $checkColor->g = $color->g;
                        $checkColor->b = $color->b;
                    }

                    if ($color->differs($checkColor, $tolerance)) {
                        $top_x = max(0, $x - $feather);
                        break 2;
                    }

                }
            }

        }

        // search lower part of image for colors to trim away
        if (in_array('bottom', $away)) {

            for ($y=($height-1); $y >= floor($height/2)-1; $y--) {
                for ($x=$top_x; $x < $width; $x++) {

                    $checkColor = $image->pickColor($x, $y, 'object');

                    if ($checkTransparency) {
                        $checkColor->r = $color->r;
                        $checkColor->g = $color->g;
                        $checkColor->b = $color->b;
                    }

                    if ($color->differs($checkColor, $tolerance)) {
                        $bottom_y = min($height, $y+1 + $feather);
                        break 2;
                    }

                }
            }

        }

        // search right part of image for colors to trim away
        if (in_array('right', $away)) {

            for ($x=($width-1); $x >= floor($width/2)-1; $x--) {
                for ($y=$top_y; $y < $bottom_y; $y++) {

                    $checkColor = $image->pickColor($x, $y, 'object');

                    if ($checkTransparency) {
                        $checkColor->r = $color->r;
                        $checkColor->g = $color->g;
                        $checkColor->b = $color->b;
                    }

                    if ($color->differs($checkColor, $tolerance)) {
                        $bottom_x = min($width, $x+1 + $feather);
                        break 2;
                    }

                }
            }

        }


        // trim parts of image
        return $this->modify($image, 0, 0, $top_x, $top_y, ($bottom_x-$top_x), ($bottom_y-$top_y), ($bottom_x-$top_x), ($bottom_y-$top_y));

    }
}
