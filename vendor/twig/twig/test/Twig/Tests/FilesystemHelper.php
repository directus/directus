<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_FilesystemHelper
{
    public static function removeDir($dir)
    {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, PHP_VERSION_ID < 50300 ? 0 : FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($iterator as $filename => $fileInfo) {
            if ($iterator->isDot()) {
                continue;
            }

            if ($fileInfo->isDir()) {
                rmdir($filename);
            } else {
                unlink($filename);
            }
        }
        rmdir($dir);
    }
}
