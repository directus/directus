#!/usr/bin/php
<?php

use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;
use Directus\Media\Thumbnail;
use Zend\Db\TableGateway\TableGateway;

require 'directusLoader.php';

function out($string) {
	echo "$string\n";
}

$supportedExtensions = array('jpg','jpeg','png','gif', 'psd', 'psf', 'tif');

out("Running script with the following supported extensions: " . implode(", ", $supportedExtensions));

$db = \Directus\Bootstrap::get('ZendDb');
$acl = \Directus\Bootstrap::get('acl');

$Settings = new DirectusSettingsTableGateway($acl, $db);
$mediaSettings = $Settings->fetchCollection('media', array(
    'storage_adapter','storage_destination','thumbnail_storage_adapter',
    'thumbnail_storage_destination', 'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
));

$StorageAdapters = new DirectusStorageAdaptersTableGateway($acl, $db);
$storageAdaptersById = $StorageAdapters->fetchAllWithIdKeys();
foreach($storageAdaptersById as $id => $storageAdapter) {
	$storageAdaptersById[$id] = \Directus\Media\Storage\Storage::getStorage($storageAdapter);
}

out("Loaded " . count($storageAdaptersById) . " storage adapters.");

$DirectusMedia = new TableGateway('directus_media', $db);
$mediaRecords = $DirectusMedia->select();

out("Found " . $mediaRecords->count() . " Directus media records.");

$thumbnailStorageAdapterResultSet = $StorageAdapters->fetchByUniqueRoles(array('THUMBNAIL'));
if(1 != count($thumbnailStorageAdapterResultSet)) {
	throw new \RuntimeException("Fatal: exactly one storage adapter with role THUMBNAIL is required");
}
$thumbnailStorageAdapterSettings = array_pop($thumbnailStorageAdapterResultSet);
if('FileSystemAdapter' != $thumbnailStorageAdapterSettings['adapter_name']) {
	throw new \RuntimeException("Fatal: THUMBNAIL storage adapter: only FileSystemAdapter is currently supported by this script");
}
$thumbnailStorageAdapter = $storageAdaptersById[$thumbnailStorageAdapterSettings['id']];

$statistics = array(
	'success' => 0,
	'failure' => 0,
	'exists' => 0
);

foreach($mediaRecords as $media) {
	if(!isset($storageAdaptersById[$media['storage_adapter']])) {
		throw new \RuntimeException("Media record #" . $media['id'] . " refers to non-existent storage adapter #" . $media['storage_adapter']);
	}
	$storageAdapter = $storageAdaptersById[$media['storage_adapter']];
	$adapterSettings = $storageAdapter->getSettings();
  $info = pathinfo($media['name']);
	if('FileSystemAdapter' != $adapterSettings['adapter_name']) {
		out("Skipping media record #" . $media['id'] . " using storage adapter #" . $adapterSettings['id'] . " -- only FileSystemAdapter is currently supported by this script.");
		$statistics['failure']++;
		continue;
	}
	if(!$storageAdapter->fileExists($media['name'], $adapterSettings['destination'])) {
		out("Skipping media record #" . $media['id'] . " -- adapter can't locate original file.");
		$statistics['failure']++;
		continue;
	}
    if(!in_array($info['extension'], $supportedExtensions)) {
		out("Skipping media record #" . $media['id'] . " -- the following extension is unsupported: " . $info['extension']);
		$statistics['failure']++;
		continue;
    }
	if($thumbnailStorageAdapter->fileExists($media['id'].".".$info['extension'], $thumbnailStorageAdapterSettings['destination'])) {
		$statistics['exists']++;
		continue;
	}
    // Generate thumbnail
    $localFile = $storageAdapter->joinPaths($adapterSettings['destination'], $media['name']);
    $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $mediaSettings['thumbnail_size'], $mediaSettings['thumbnail_crop_enabled']);
    $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
    Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $mediaSettings['thumbnail_quality']);
    $fileData = $thumbnailStorageAdapter->acceptFile($thumbnailTempName, $media['id'].'.'.$info['extension'], $thumbnailStorageAdapterSettings['destination']);
    $statistics['success']++;
}

out('');
out('Statistics:');
out('-----------');
foreach($statistics as $name => $value) {
	out("$name: $value");
}