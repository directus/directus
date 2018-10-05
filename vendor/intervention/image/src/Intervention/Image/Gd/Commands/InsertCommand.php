<?php

namespace Intervention\Image\Gd\Commands;

class InsertCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Insert another image into given image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $source = $this->argument(0)->required()->value();
        $position = $this->argument(1)->type('string')->value();
        $x = $this->argument(2)->type('digit')->value(0);
        $y = $this->argument(3)->type('digit')->value(0);

        // build watermark
        $watermark = $image->getDriver()->init($source);

        // define insertion point
        $image_size = $image->getSize()->align($position, $x, $y);
        $watermark_size = $watermark->getSize()->align($position);
        $target = $image_size->relativePosition($watermark_size);

        // insert image at position
        imagealphablending($image->getCore(), true);
        return imagecopy($image->getCore(), $watermark->getCore(), $target->x, $target->y, 0, 0, $watermark_size->width, $watermark_size->height);
    }
}
