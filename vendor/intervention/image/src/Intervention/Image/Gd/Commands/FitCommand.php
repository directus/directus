<?php

namespace Intervention\Image\Gd\Commands;

use Intervention\Image\Size;

class FitCommand extends ResizeCommand
{
    /**
     * Crops and resized an image at the same time
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $width = $this->argument(0)->type('digit')->required()->value();
        $height = $this->argument(1)->type('digit')->value($width);
        $constraints = $this->argument(2)->type('closure')->value();
        $position = $this->argument(3)->type('string')->value('center');

        // calculate size
        $cropped = $image->getSize()->fit(new Size($width, $height), $position);
        $resized = clone $cropped;
        $resized = $resized->resize($width, $height, $constraints);

        // modify image
        $this->modify($image, 0, 0, $cropped->pivot->x, $cropped->pivot->y, $resized->getWidth(), $resized->getHeight(), $cropped->getWidth(), $cropped->getHeight());

        return true;
    }
}
