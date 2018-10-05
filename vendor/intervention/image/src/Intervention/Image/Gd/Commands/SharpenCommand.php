<?php

namespace Intervention\Image\Gd\Commands;

class SharpenCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Sharpen image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $amount = $this->argument(0)->between(0, 100)->value(10);

        // build matrix
        $min = $amount >= 10 ? $amount * -0.01 : 0;
        $max = $amount * -0.025;
        $abs = ((4 * $min + 4 * $max) * -1) + 1;
        $div = 1;

        $matrix = [
            [$min, $max, $min],
            [$max, $abs, $max],
            [$min, $max, $min]
        ];

        // apply the matrix
        return imageconvolution($image->getCore(), $matrix, $div, 0);
    }
}
