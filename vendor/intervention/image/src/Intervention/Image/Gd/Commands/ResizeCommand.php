<?php

namespace Intervention\Image\Gd\Commands;

use Intervention\Image\Commands\AbstractCommand;

class ResizeCommand extends AbstractCommand
{
    /**
     * Resizes image dimensions
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $width = $this->argument(0)->value();
        $height = $this->argument(1)->value();
        $constraints = $this->argument(2)->type('closure')->value();

        // resize box
        $resized = $image->getSize()->resize($width, $height, $constraints);

        // modify image
        $this->modify($image, 0, 0, 0, 0, $resized->getWidth(), $resized->getHeight(), $image->getWidth(), $image->getHeight());

        return true;
    }

    /**
     * Wrapper function for 'imagecopyresampled'
     *
     * @param  Image   $image
     * @param  int     $dst_x
     * @param  int     $dst_y
     * @param  int     $src_x
     * @param  int     $src_y
     * @param  int     $dst_w
     * @param  int     $dst_h
     * @param  int     $src_w
     * @param  int     $src_h
     * @return boolean
     */
    protected function modify($image, $dst_x, $dst_y, $src_x, $src_y, $dst_w, $dst_h, $src_w, $src_h)
    {
        // create new image
        $modified = imagecreatetruecolor($dst_w, $dst_h);

        // get current image
        $resource = $image->getCore();

        // preserve transparency
        $transIndex = imagecolortransparent($resource);

        if ($transIndex != -1) {
            $rgba = imagecolorsforindex($modified, $transIndex);
            $transColor = imagecolorallocatealpha($modified, $rgba['red'], $rgba['green'], $rgba['blue'], 127);
            imagefill($modified, 0, 0, $transColor);
            imagecolortransparent($modified, $transColor);
        } else {
            imagealphablending($modified, false);
            imagesavealpha($modified, true);
        }

        // copy content from resource
        $result = imagecopyresampled(
            $modified,
            $resource,
            $dst_x,
            $dst_y,
            $src_x,
            $src_y,
            $dst_w,
            $dst_h,
            $src_w,
            $src_h
        );

        // set new content as recource
        $image->setCore($modified);

        return $result;
    }
}
