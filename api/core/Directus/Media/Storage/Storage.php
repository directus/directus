<?php

namespace Directus\Media\Storage;

use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Media\Thumbnail;
use Directus\Util\Formatting;

class Storage {

	const ADAPTER_NAMESPACE = "\\Directus\\Media\\Storage\\Adapter";

    /** @var DirectusSettingsTableGateway */
    protected $settings;

    /** @var array */
    protected $mediaSettings = array();

    /** @var array */
    protected $storages = array();

    public function __construct() {
        $this->acl = Bootstrap::get('acl');
        $this->adapter = Bootstrap::get('ZendDb');
        // Fetch media settings
        $this->settings = new DirectusSettingsTableGateway($this->acl, $this->adapter);
        $this->mediaSettings = $this->settings->fetchCollection('media', array(
            'storage_adapter','storage_destination','thumbnail_storage_adapter',
            'thumbnail_storage_destination', 'thumbnail_size', 'thumbnail_quality'
        ));
    }

    /**
     * @param  string $adapterName
     * @return \Directus\Media\Storage\Adapter\Adapter
     */
    protected function getStorage($adapterName) {
        if(!isset($this->storages[$adapterName])) {
			$adapterClass = self::ADAPTER_NAMESPACE . "\\$adapterName";
			if(!class_exists($adapterClass)) {
				throw new RuntimeException("No such adapter class: $adapterClass");
			}
            $this->storages[$adapterName] = new $adapterClass;
        }
        return $this->storages[$adapterName];
    }

    public function acceptFile($localFile, $targetFileName) {
        $settings = $this->mediaSettings;
        $Storage = $this->getStorage($settings['storage_adapter']);

        $fileData = $Storage->getUploadInfo($localFile);

        // Generate thumbnail if image
        $thumbnailTempName = null;
        $info = pathinfo($targetFileName);
        if(in_array($info['extension'], array('jpg','jpeg','png','gif'))) {
            $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $settings['thumbnail_size']);
            $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
            Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $settings['thumbnail_quality']);
        }

        // Push original file
        $finalPath = $Storage->acceptFile($localFile, $targetFileName, $settings['storage_destination']);
        $fileData['name'] = basename($finalPath);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileData['name']);
        $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');

        // Push thumbnail file if applicable (if image)
        if(!is_null($thumbnailTempName)) {
            $ThumbnailStorage = $this->getStorage($settings['thumbnail_storage_adapter']);
            $ThumbnailStorage->acceptFile($thumbnailTempName, $fileData['name'], $settings['thumbnail_storage_destination']);
        }

        return $fileData;
    }

}
