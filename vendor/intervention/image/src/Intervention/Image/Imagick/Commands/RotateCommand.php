<?php

namespace Intervention\Image\Imagick\Commands;

use Intervention\Image\Imagick\Color;

class RotateCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Rotates image counter clockwise
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $angle = $this->argument(0)->type('numeric')->required()->value();
        $color = $this->argument(1)->value();
        $color = new Color($color);

        // restrict rotations beyond 360 degrees, since the end result is the same
        $angle %= 360;

        // rotate image
        $image->getCore()->rotateImage($color->getPixel(), ($angle * -1));

        return true;
    }
}
