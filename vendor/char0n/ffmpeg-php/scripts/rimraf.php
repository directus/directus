<?php
require_once 'vendor/autoload.php';

use \FilesystemHelper\FilesystemHelper;

try {
    $toDelete = getcwd() . DIRECTORY_SEPARATOR . $argv[1];
    FilesystemHelper::deleteR($toDelete, null);
    rmdir($toDelete);
    unlink($toDelete);
} catch (\Exception $e) {
    // pass
}
