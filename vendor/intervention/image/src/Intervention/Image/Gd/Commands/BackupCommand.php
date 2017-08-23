<?php

namespace Intervention\Image\Gd\Commands;

class BackupCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Saves a backups of current state of image core
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $backupName = $this->argument(0)->value();

        // clone current image resource
        $size = $image->getSize();
        $clone = imagecreatetruecolor($size->width, $size->height);
        imagealphablending($clone, false);
        imagesavealpha($clone, true);
        $transparency = imagecolorallocatealpha($clone, 0, 0, 0, 127);
        imagefill($clone, 0, 0, $transparency);

        // copy image to clone
        imagecopy($clone, $image->getCore(), 0, 0, 0, 0, $size->width, $size->height);

        $image->setBackup($clone, $backupName);

        return true;
    }
}
