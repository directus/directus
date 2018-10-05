<?php

namespace Intervention\Image\Commands;

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
        if ( ! function_exists('exif_read_data')) {
            throw new \Intervention\Image\Exception\NotSupportedException(
                "Reading Exif data is not supported by this PHP installation."
            );
        }

        $key = $this->argument(0)->value();

        // try to read exif data from image file
        $data = @exif_read_data($image->dirname .'/'. $image->basename);

        if (! is_null($key) && is_array($data)) {
            $data = array_key_exists($key, $data) ? $data[$key] : false;
        }

        $this->setOutput($data);

        return true;
    }
}
