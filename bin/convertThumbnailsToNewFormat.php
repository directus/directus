#!/usr/bin/php
<?php

//Used to grab thumbs from temp and put to thumbs

use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;
use Directus\Files\Thumbnail;
use Zend\Db\TableGateway\TableGateway;

require 'directusLoader.php';

function out($string)
{
    echo "$string\n";
}

$supportedExtensions = array('jpg', 'jpeg', 'png', 'gif');

out('Running script with the following supported extensions: ' . implode(', ', $supportedExtensions));

$db = \Directus\Bootstrap::get('ZendDb');
$acl = \Directus\Bootstrap::get('acl');

$Settings = new DirectusSettingsTableGateway($acl, $db);
$filesSettings = $Settings->fetchCollection('media', array(
    'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
));

$StorageAdapters = new DirectusStorageAdaptersTableGateway($acl, $db);
$storageAdaptersById = $StorageAdapters->fetchAllWithIdKeys();
foreach ($storageAdaptersById as $id => $storageAdapter) {
    // @TODO: fix this, this class was removed time ago.
    $storageAdaptersById[$id] = \Directus\Files\Storage\Storage::getStorage($storageAdapter);
}
out("\nLoaded " . count($storageAdaptersById) . ' storage adapters.');

$DirectusMedia = new TableGateway('directus_files', $db);
$mediaRecords = $DirectusMedia->select();

out('Found ' . $mediaRecords->count() . ' Directus media records.');

$thumbnailStorageAdapterResultSet = $StorageAdapters->fetchByUniqueRoles(array('THUMBNAIL'));
if (1 != count($thumbnailStorageAdapterResultSet)) {
    throw new \RuntimeException('Fatal: exactly one storage adapter with role THUMBNAIL is required');
}
$thumbnailStorageAdapterSettings = array_pop($thumbnailStorageAdapterResultSet);
if ('FileSystemAdapter' != $thumbnailStorageAdapterSettings['adapter_name']) {
    throw new \RuntimeException('Fatal: THUMBNAIL storage adapter: only FileSystemAdapter is currently supported by this script');
}
$thumbnailStorageAdapter = $storageAdaptersById[$thumbnailStorageAdapterSettings['id']];

$tempStorageAdapterResultSet = $StorageAdapters->fetchByUniqueRoles(array('TEMP'));
if (1 != count($tempStorageAdapterResultSet)) {
    throw new \RuntimeException('Fatal: exactly one storage adapter with role TEMP is required');
}
$tempStorageAdapterSettings = array_pop($tempStorageAdapterResultSet);
if ('FileSystemAdapter' != $tempStorageAdapterSettings['adapter_name']) {
    throw new \RuntimeException('Fatal: TEMP storage adapter: only FileSystemAdapter is currently supported by this script');
}
$tempStorageAdapter = $storageAdaptersById[$tempStorageAdapterSettings['id']];

$statistics = array(
    'success' => 0,
    'failure' => 0,
    'exists' => 0
);

foreach ($mediaRecords as $media) {
    $adapterSettings = $tempStorageAdapterSettings;
    if (!$tempStorageAdapter->fileExists($media['name'], $adapterSettings['destination'])) {
        out('Skipping media record #' . $media['id'] . " -- adapter can't locate original file.\n");
        $statistics['failure']++;
        continue;
    }
    $info = pathinfo($media['name']);
    if (!in_array($info['extension'], $supportedExtensions)) {
        out('Skipping media record #' . $media['id'] . ' -- the following extension is unsupported: ' . $info['extension'] . "\n");
        $statistics['failure']++;
        continue;
    }
    if ($thumbnailStorageAdapter->fileExists($media['id'], $thumbnailStorageAdapterSettings['destination'])) {
        $statistics['exists']++;
        continue;
    }
    // Generate thumbnail
    $localFile = $tempStorageAdapter->joinPaths($adapterSettings['destination'], $media['name']);
    $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $filesSettings['thumbnail_size'], $filesSettings['thumbnail_crop_enabled']);
    $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
    Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $filesSettings['thumbnail_quality']);
    $fileData = $thumbnailStorageAdapter->acceptFile($thumbnailTempName, $media['id'] . '.' . $info['extension'], $thumbnailStorageAdapterSettings['destination']);
    $statistics['success']++;
}

out('');
out('Statistics:');
out('-----------');
foreach ($statistics as $name => $value) {
    out("$name: $value");
}
