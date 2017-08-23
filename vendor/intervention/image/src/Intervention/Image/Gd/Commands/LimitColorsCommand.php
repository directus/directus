<?php

namespace Intervention\Image\Gd\Commands;


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

        // create empty canvas
        $resource = imagecreatetruecolor($size->width, $size->height);

        // define matte
        if (is_null($matte)) {
            $matte = imagecolorallocatealpha($resource, 255, 255, 255, 127);
        } else {
            $matte = $image->getDriver()->parseColor($matte)->getInt();
        }

        // fill with matte and copy original image
        imagefill($resource, 0, 0, $matte);

        // set transparency
        imagecolortransparent($resource, $matte);

        // copy original image
        imagecopy($resource, $image->getCore(), 0, 0, 0, 0, $size->width, $size->height);

        if (is_numeric($count) && $count <= 256) {
            // decrease colors
            imagetruecolortopalette($resource, true, $count);
        }

        // set new resource
        $image->setCore($resource);

        return true;
    }
}
