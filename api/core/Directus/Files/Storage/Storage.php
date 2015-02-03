<?php

namespace Directus\Files\Storage;

use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;
use Directus\Files\Thumbnail;
use Directus\Util\Formatting;

class Storage {

	const ADAPTER_NAMESPACE = "\\Directus\\Files\\Storage\\Adapter";

    /** @var DirectusSettingsTableGateway */
    protected $settings;

    /** @var array */
    protected $filesSettings = array();

    /** @var array */
    protected static $storages = array();

    public function __construct() {
        $this->acl = Bootstrap::get('acl');
        $this->adapter = Bootstrap::get('ZendDb');
        // Fetch files settings
        $Settings = new DirectusSettingsTableGateway($this->acl, $this->adapter);
        $this->filesSettings = $Settings->fetchCollection('files', array(
            'storage_adapter','storage_destination','thumbnail_storage_adapter',
            'thumbnail_storage_destination', 'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
        ));
        // Initialize Storage Adapters
        $StorageAdapters = new DirectusStorageAdaptersTableGateway($this->acl, $this->adapter);
        $adapterRoles = array('DEFAULT','THUMBNAIL', 'TEMP');
        $storage = $StorageAdapters->fetchByUniqueRoles($adapterRoles);
        if(count($storage) !== count($adapterRoles)) {
            throw new \RuntimeException(__CLASS__ . ' expects adapter settings for these default adapter roles: ' . implode(',', $adapterRoles));
        }
        $this->FilesStorage = self::getStorage($storage['DEFAULT']);
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
     * @return \Directus\Files\Storage\Adapter\Adapter
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
        $settings = $this->filesSettings;
        $fileData = $this->FilesStorage->getUploadInfo($localFile);


        // Generate thumbnail if image
        $thumbnailTempName = null;
        $info = pathinfo($targetFileName);
        if(in_array($info['extension'], array('jpg','jpeg','png','gif','tif', 'tiff', 'psd', 'pdf'))) {
            $img = Thumbnail::generateThumbnail($localFile, $info['extension'], $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
            if($img) {
              $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
              Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $settings['thumbnail_quality']);
            }
        }

        // Push original file
        $filesAdapter = $this->storageAdaptersByRole['TEMP'];
        $finalPath = $this->FilesStorage->acceptFile($localFile, $targetFileName, $filesAdapter['destination']);
        $fileData['name'] = basename($finalPath);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileData['name']);
        $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
        $fileData['storage_adapter'] = $filesAdapter['id'];


        // Push thumbnail file if applicable (if image) with prefix THUMB_
        if(!is_null($thumbnailTempName)) {
            $info = pathinfo($fileData['name']);
            if( in_array($info['extension'], array('tif', 'tiff', 'pdf', 'psd'))) {
              $this->ThumbnailStorage->acceptFile($thumbnailTempName, 'THUMB_'.$info['filename'].'.jpg', $filesAdapter['destination']);
            } else {
              $this->ThumbnailStorage->acceptFile($thumbnailTempName, 'THUMB_'.$fileData['name'], $filesAdapter['destination']);
            }
        }

        return $fileData;
    }

    public function acceptLink($link) {
        $settings = $this->filesSettings;
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

          $filesAdapter = $this->storageAdaptersByRole['TEMP'];
          $fileData['name'] = "youtube_" . $video_id . ".jpg";
          $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
          $fileData['storage_adapter'] = $filesAdapter['id'];
          $fileData['charset'] = '';

          $img = Thumbnail::generateThumbnail('http://img.youtube.com/vi/' . $video_id . '/0.jpg', 'jpeg', $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
          $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
          Thumbnail::writeImage('jpg', $thumbnailTempName, $img, $settings['thumbnail_quality']);
          if(!is_null($thumbnailTempName)) {
            $this->ThumbnailStorage->acceptFile($thumbnailTempName, 'THUMB_'.$fileData['name'], $filesAdapter['destination']);
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
        } else if(strpos($link,'vimeo.com') !== false) {
        // Get ID from URL
          preg_match('/vimeo\.com\/([0-9]{1,10})/', $link, $matches);
          $video_id = $matches[1];

          // Can't find the video ID
          if($video_id === FALSE){
            die("Vimeo video ID not detected. Please paste the whole URL.");
          }

          $fileData['url'] = $video_id;
          $fileData['type'] = 'embed/vimeo';

          $filesAdapter = $this->storageAdaptersByRole['TEMP'];
          $fileData['name'] = "vimeo_" . $video_id . ".jpg";
          $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
          $fileData['storage_adapter'] = $filesAdapter['id'];
          $fileData['charset'] = '';

          // Get Data
          $url = 'http://vimeo.com/api/v2/video/' . $video_id . '.php';
          $ch = curl_init($url);
          curl_setopt ($ch, CURLOPT_RETURNTRANSFER, true);
          curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 0);
          $content = curl_exec($ch);
          curl_close($ch);
          $array = unserialize(trim($content));

          if($content !== false) {
            $fileData['title'] = $array[0]['title'];
            $fileData['caption'] = strip_tags($array[0]['description']);
            $fileData['size'] = $array[0]['duration'];
            $fileData['height'] = $array[0]['height'];
            $fileData['width'] = $array[0]['width'];
            $fileData['tags'] = $array[0]['tags'];
            $vimeo_thumb = $array[0]['thumbnail_large'];

            $img = Thumbnail::generateThumbnail($vimeo_thumb, 'jpeg', $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
            $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
            Thumbnail::writeImage('jpg', $thumbnailTempName, $img, $settings['thumbnail_quality']);
            if(!is_null($thumbnailTempName)) {
              $this->ThumbnailStorage->acceptFile($thumbnailTempName, 'THUMB_'.$fileData['name'], $filesAdapter['destination']);
            }
          } else {
            // Unable to get Vimeo details
            $fileData['title'] = "Unable to Retrieve Vimeo Title";
            $fileData['height'] = 340;
            $fileData['width'] = 560;
          }
        } else {
          //Arnt youtube or voimeo so try to curl photo and use uploadfile
          $content = file_get_contents($link);
          $tmpFile = tempnam(sys_get_temp_dir(), 'DirectusFile');
          file_put_contents($tmpFile, $content);
          $stripped_url = preg_replace('/\\?.*/', '', $link);
          $realfilename = basename($stripped_url);
          return self::acceptFile($tmpFile, $realfilename);
        }

        return $fileData;
    }

    public function saveFile($fileName, $destStorageAdapterId, $newName = null) {
        $settings = $this->filesSettings;
        $finalName = null;
        $StorageAdapters = new DirectusStorageAdaptersTableGateway($this->acl, $this->adapter);

        //If desired Storage Adapter Exists...
        $filesAdapter = $StorageAdapters->fetchOneById($destStorageAdapterId);
        if($filesAdapter) {
          //Get Temp File Path from Temp StorageAdapter
          $tempLocation = $this->storageAdaptersByRole['TEMP']['destination'];
          //Try to accept file into new fella
          if(file_exists($tempLocation.$fileName)) {
            $destName = ($newName == null) ? $fileName : $newName;
            $finalPath = $this->FilesStorage->acceptFile($tempLocation.$fileName, $destName, $filesAdapter['destination']);
            $finalName = basename($finalPath);
          } else{
            $finalName = $fileName;
          }

        } else {
          die("ERROR! No Storage Adapter found with Designated ID: ".$destStorageAdapterId);
        }

        return $finalName;
    }

    private function get_string_between($string, $start, $end){
      $string = " ".$string;
      $ini = strpos($string,$start);
      if ($ini == 0) return "";
      $ini += strlen($start);
      $len = strpos($string,$end,$ini) - $ini;
      return substr($string,$ini,$len);
    }

    public function getfilesSettings() {
      return $this->filesSettings;
    }
}


