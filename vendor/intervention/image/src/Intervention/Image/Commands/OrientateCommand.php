<?php

namespace Intervention\Image\Commands;

class OrientateCommand extends AbstractCommand
{
    /**
     * Correct image orientation according to Exif data
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        switch ($image->exif('Orientation')) {

            case 2:
                $image->flip();
                break;

            case 3:
                $image->rotate(180);
                break;

            case 4:
                $image->rotate(180)->flip();
                break;

            case 5:
                $image->rotate(270)->flip();
                break;

            case 6:
                $image->rotate(270);
                break;

            case 7:
                $image->rotate(90)->flip();
                break;

            case 8:
                $image->rotate(90);
                break;
        }

        return true;
    }
}
