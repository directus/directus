#!/usr/bin/php
<?php
ini_set('memory_limit', '-1');
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\Database\TableGateway\DirectusStorageAdaptersTableGateway;
use Directus\Files\Thumbnail;
use Zend\Db\TableGateway\TableGateway;

require 'directusLoader.php';

function out($string)
{
    echo "$string\n";
}

$supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'psd', 'psf', 'tif', 'tiff'];

out('Running script with the following supported extensions: ' . implode(', ', $supportedExtensions));

$db = \Directus\Bootstrap::get('ZendDb');
$acl = \Directus\Bootstrap::get('acl');

$Settings = new DirectusSettingsTableGateway($acl, $db);
$filesSettings = $Settings->fetchCollection('media', [
    'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
]);

$StorageAdapters = new DirectusStorageAdaptersTableGateway($acl, $db);
$storageAdaptersById = $StorageAdapters->fetchAllWithIdKeys();
foreach ($storageAdaptersById as $id => $storageAdapter) {
    $storageAdaptersById[$id] = \Directus\Files\Storage\Storage::getStorage($storageAdapter);
}

out('Loaded ' . count($storageAdaptersById) . ' storage adapters.');

$DirectusMedia = new TableGateway('directus_files', $db);
$mediaRecords = $DirectusMedia->select();

out('Found ' . $mediaRecords->count() . ' Directus media records.');

$thumbnailStorageAdapterResultSet = $StorageAdapters->fetchByUniqueRoles(['THUMBNAIL']);
if (1 != count($thumbnailStorageAdapterResultSet)) {
    throw new \RuntimeException('Fatal: exactly one storage adapter with role THUMBNAIL is required');
}
$thumbnailStorageAdapterSettings = array_pop($thumbnailStorageAdapterResultSet);
if ('FileSystemAdapter' != $thumbnailStorageAdapterSettings['adapter_name']) {
    throw new \RuntimeException('Fatal: THUMBNAIL storage adapter: only FileSystemAdapter is currently supported by this script');
}
$thumbnailStorageAdapter = $storageAdaptersById[$thumbnailStorageAdapterSettings['id']];

$statistics = [
    'success' => 0,
    'failure' => 0,
    'exists' => 0
];

foreach ($mediaRecords as $media) {
    if (!isset($storageAdaptersById[$media['storage_adapter']])) {
        throw new \RuntimeException('Files record #' . $media['id'] . ' refers to non-existent storage adapter #' . $media['storage_adapter']);
    }
    $storageAdapter = $storageAdaptersById[1];
    $adapterSettings = $storageAdapter->getSettings();
    $info = pathinfo($media['name']);
    /*if('FileSystemAdapter' != $adapterSettings['adapter_name']) {
      out("Skipping media record #" . $media['id'] . " using storage adapter #" . $adapterSettings['id'] . " -- only FileSystemAdapter is currently supported by this script.");
      $statistics['failure']++;
      continue;
    }*/
    if (!$storageAdapter->fileExists($media['name'], '/Users/developer1/Desktop/hat/')) {
        out('Skipping media record #' . $media['id'] . ' -- adapter can\'t locate original file.');
        $statistics['failure']++;
        continue;
    }
    if (!in_array($info['extension'], $supportedExtensions)) {
        out('Skipping media record #' . $media['id'] . ' -- the following extension is unsupported: ' . $info['extension']);
        $statistics['failure']++;
        continue;
    }
    if ($thumbnailStorageAdapter->fileExists($media['id'] . '.' . $info['extension'], '/Users/developer1/Desktop/thumbnails/')) {
        $statistics['exists']++;
        continue;
    }
    // Generate thumbnail
    $localFile = $storageAdapter->joinPaths('/Users/developer1/Desktop/hat/', $media['name']);
    $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $filesSettings['thumbnail_size'], $filesSettings['thumbnail_crop_enabled']);
    $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
    Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $filesSettings['thumbnail_quality']);
    $fileData = $thumbnailStorageAdapter->acceptFile($thumbnailTempName, $media['id'] . '.' . $info['extension'], '/Users/developer1/Desktop/thumbnails/');
    $statistics['success']++;
}

out('');
out('Statistics:');
out('-----------');
foreach ($statistics as $name => $value) {
    out("$name: $value");
}
