<?php

namespace Directus\Media\Storage;

use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;
use Directus\Media\Thumbnail;
use Directus\Util\Formatting;

class Storage {

	const ADAPTER_NAMESPACE = "\\Directus\\Media\\Storage\\Adapter";

    /** @var DirectusSettingsTableGateway */
    protected $settings;

    /** @var array */
    protected $mediaSettings = array();

    /** @var array */
    protected static $storages = array();

    public function __construct() {
        $this->acl = Bootstrap::get('acl');
        $this->adapter = Bootstrap::get('ZendDb');
        // Fetch media settings
        $Settings = new DirectusSettingsTableGateway($this->acl, $this->adapter);
        $this->mediaSettings = $Settings->fetchCollection('media', array(
            'storage_adapter','storage_destination','thumbnail_storage_adapter',
            'thumbnail_storage_destination', 'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
        ));
        // Initialize Storage Adapters
        $StorageAdapters = new DirectusStorageAdaptersTableGateway($this->acl, $this->adapter);
        $adapterRoles = array('DEFAULT','THUMBNAIL');
        $storage = $StorageAdapters->fetchByUniqueRoles($adapterRoles);
        if(count($storage) !== count($adapterRoles)) {
            throw new \RuntimeException(__CLASS__ . ' expects adapter settings for these default adapter roles: ' . implode(',', $adapterRoles));
        }
        $this->MediaStorage = self::getStorage($storage['DEFAULT']);
        $this->ThumbnailStorage = self::getStorage($storage['THUMBNAIL']);
        $this->storageAdaptersByRole = $storage;
    }

    /**
     * @param  string $string Potentially valid JSON.
     * @return array
     */
    public static function jsonDecodeIfPossible($string) {
        if(!empty($string) && $decoded = json_decode($string, true)) {
            return $decoded;
        }
        return array();
    }

    /**
     * @param  array $adapterSettings
     * @return \Directus\Media\Storage\Adapter\Adapter
     */
    public static function getStorage(array &$adapterSettings) {
        $adapterName = $adapterSettings['adapter_name'];
        if(!is_array($adapterSettings['params'])) {
            $adapterSettings['params'] = self::jsonDecodeIfPossible($adapterSettings['params']);
        }
        $cacheKey = $adapterName . serialize($adapterSettings['params']);
        if(!isset(self::$storages[$cacheKey])) {
			$adapterClass = self::ADAPTER_NAMESPACE . "\\$adapterName";
			if(!class_exists($adapterClass)) {
				throw new \RuntimeException("No such adapter class: $adapterClass");
			}
            self::$storages[$cacheKey] = new $adapterClass($adapterSettings);
        }
        return self::$storages[$cacheKey];
    }

    public function acceptFile($localFile, $targetFileName) {
        $settings = $this->mediaSettings;
        $fileData = $this->MediaStorage->getUploadInfo($localFile);

        // Generate thumbnail if image
        $thumbnailTempName = null;
        $info = pathinfo($targetFileName);
        if(in_array($info['extension'], array('jpg','jpeg','png','gif'))) {
            $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
            $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
            Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $settings['thumbnail_quality']);
        }

        // Push original file
        $mediaAdapter = $this->storageAdaptersByRole['DEFAULT'];
        $finalPath = $this->MediaStorage->acceptFile($localFile, $targetFileName, $mediaAdapter['destination']);
        $fileData['name'] = basename($finalPath);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileData['name']);
        $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
        $fileData['storage_adapter'] = $mediaAdapter['id'];

        // Push thumbnail file if applicable (if image)
        if(!is_null($thumbnailTempName)) {
            $thumbnailDestination = $this->storageAdaptersByRole['THUMBNAIL']['destination'];
            $this->ThumbnailStorage->acceptFile($thumbnailTempName, $fileData['name'], $thumbnailDestination);
        }

        return $fileData;
    }

    public function acceptLink($link) {
        $settings = $this->mediaSettings;
        $fileData = array();

        if (strpos($link,'youtube.com') !== false) {
          // Get ID from URL
          parse_str(parse_url($link, PHP_URL_QUERY), $array_of_vars);
          $video_id = $array_of_vars['v'];

          // Can't find the video ID
          if($video_id === FALSE){
            die("YouTube video ID not detected. Please paste the whole URL.");
          }

          $fileData['url'] = $video_id;
          $fileData['type'] = 'embed/youtube';
          $fileData['height'] = 340;
          $fileData['width'] = 560;

          // Get Data
          $url = "http://gdata.youtube.com/feeds/api/videos/". $video_id;
          $ch = curl_init($url);
          curl_setopt ($ch, CURLOPT_RETURNTRANSFER, true);
          curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 0);
          $content = curl_exec($ch);
          curl_close($ch);

          $mediaAdapter = $this->storageAdaptersByRole['DEFAULT'];
          $fileData['name'] = "youtube_" . $video_id . ".jpg";
          $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
          $fileData['storage_adapter'] = $mediaAdapter['id'];
          $fileData['charset'] = '';

          $img = Thumbnail::generateThumbnail('http://img.youtube.com/vi/' . $video_id . '/0.jpg', 'jpeg', $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
          $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
          Thumbnail::writeImage('jpg', $thumbnailTempName, $img, $settings['thumbnail_quality']);
          if(!is_null($thumbnailTempName)) {
            $thumbnailDestination = $this->storageAdaptersByRole['THUMBNAIL']['destination'];
            $this->ThumbnailStorage->acceptFile($thumbnailTempName, $fileData['name'], $thumbnailDestination);
          }

          if ($content !== false) {
            $fileData['title'] = $this->get_string_between($content,"<title type='text'>","</title>");

            // Not pretty hack to get duration
            $pos_1 = strpos($content, "yt:duration seconds=") + 21;
            $fileData['size'] = substr($content,$pos_1,10);
            $fileData['size'] = preg_replace("/[^0-9]/", "", $fileData['size'] );

          } else {
            // an error happened
            $fileData['title'] = "Unable to Retrieve YouTube Title";
            $fileData['size'] = 0;
          }
        }

        return $fileData;
    }

    private function get_string_between($string, $start, $end){
      $string = " ".$string;
      $ini = strpos($string,$start);
      if ($ini == 0) return "";
      $ini += strlen($start);
      $len = strpos($string,$end,$ini) - $ini;
      return substr($string,$ini,$len);
    }
}


