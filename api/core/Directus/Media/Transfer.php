<?php

namespace Directus\Media;

use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Media\Storage\Storage;
use Directus\Media\Thumbnail;
use Directus\Util\Formatting;

class Transfer {

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
	 * @param  string $adapterDestination
	 * @return \Directus\Media\Storage\Storage
	 */
	protected function getStorage($adapterName, $adapterDestination) {
		$adapterSingletonKey = implode(":", array($adapterName, $adapterDestination));
		if(!isset($this->storages[$adapterSingletonKey])) {
			$this->storages[$adapterSingletonKey] = new Storage($adapterName, $adapterDestination);
		}
		return $this->storages[$adapterSingletonKey];
	}

	public function acceptFile($localFile, $targetFileName) {
		$settings = $this->mediaSettings;
		$Storage = $this->getStorage($settings['storage_adapter'], $settings['storage_destination']);

        $fileData = $Storage->adapter->getUploadInfo($localFile);

        // Generate thumbnail if image
        $thumbnailTempName = null;
        $info = pathinfo($targetFileName);
        if(in_array($info['extension'], array('jpg','jpeg','png','gif'))) {
            $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $settings['thumbnail_size']);
            $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
            Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $settings['thumbnail_quality']);
        }

        // Push original file
        $finalPath = $Storage->acceptFile($localFile, $targetFileName);
        $fileData['name'] = basename($finalPath);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileData['name']);
        $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');

        // Push thumbnail file if applicable (if image)
        if(!is_null($thumbnailTempName)) {
        	$ThumbnailStorage = $this->getStorage($settings['thumbnail_storage_adapter'], $settings['thumbnail_storage_destination']);
            $ThumbnailStorage->acceptFile($thumbnailTempName, $fileData['name']);
        }

        return $fileData;
	}

}