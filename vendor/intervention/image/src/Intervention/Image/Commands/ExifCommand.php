<?php

namespace Intervention\Image\Commands;

use Intervention\Image\Exception\NotReadableException;
use Intervention\Image\Exception\NotSupportedException;

class ExifCommand extends AbstractCommand
{
    /**
     * Read Exif data from the given image
     *
     * Note: Windows PHP Users - in order to use this method you will need to
     * enable the mbstring and exif extensions within the php.ini file.
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        if (!function_exists('exif_read_data')) {
            throw new NotSupportedException(
                "Reading Exif data is not supported by this PHP installation."
            );
        }

        $key = $this->argument(0)->value();

        // try to read exif data from image file
        try {
            $data = @exif_read_data($image->dirname . '/' . $image->basename);

            if (!is_null($key) && is_array($data)) {
                $data = array_key_exists($key, $data) ? $data[$key] : false;
            }

        } catch (\Exception $e) {
            throw new NotReadableException(
                sprintf(
                    "Cannot read the Exif data from the filename (%s) provided ",
                    $image->dirname . '/' . $image->basename
                ),
                $e->getCode(),
                $e
            );
        }

        $this->setOutput($data);
        return true;
    }
}
