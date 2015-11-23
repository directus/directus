<?php

namespace Directus\Files;

use Directus\Bootstrap;
use Directus\Filesystem\Filesystem;
use Directus\Filesystem\FilesystemFactory;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Util\Formatting;
use Directus\Files\Thumbnail;
use League\Flysystem\Config as FlysystemConfig;
use League\Flysystem\FileNotFoundException;

class Files
{
    private $config = [];
    private $filesSettings = [];
    private $filesystem = null;
    private $defaults = [
        'caption'   =>  '',
        'tags'      =>  '',
        'location'  =>  ''
    ];

    public function __construct()
    {
        $acl = Bootstrap::get('acl');
        $adapter = Bootstrap::get('ZendDb');
        $this->filesystem = Bootstrap::get('filesystem');
        $config = Bootstrap::get('config');
        $this->config = $config['filesystem'] ?: [];

        // Fetch files settings
        $Settings = new DirectusSettingsTableGateway($acl, $adapter);
        $this->filesSettings = $Settings->fetchCollection('files', array(
            'storage_adapter','storage_destination','thumbnail_storage_adapter',
            'thumbnail_storage_destination', 'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
        ));
    }

    // @TODO: remove exists() and rename() method
    // and move it to Directus\Filesystem Wraper
    public function exists($path)
    {
        return $this->filesystem->getAdapter()->has($path);
    }

    public function rename($path, $newPath)
    {
        return $this->filesystem->getAdapter()->rename($path, $newPath);
    }

    /**
     * Copy $_FILES data into directus media
     *
     * @param Array $_FILES data
     *
     * @return Array directus file info data
     */
    public function upload(Array $file)
    {
        $filePath = $file['tmp_name'];
        $fileName = $file['name'];

        try {
            $fileData = array_merge($this->defaults, $this->processUpload($filePath, $fileName));
            $this->createThumbnails($fileData['name']);
        } catch (FileNotFoundException $e) {
            echo $e->getMessage();
            exit;
        } catch (\Exception $e) {
            echo $e->getMessage();
            exit;
        }

        return [
            'type' => $fileData['type'],
            'name' => $fileData['name'],
            'title' => $fileData['title'],
            'tags' => $fileData['tags'],
            'caption' => $fileData['caption'],
            'location' => $fileData['location'],
            'charset' => $fileData['charset'],
            'size' => $fileData['size'],
            'width' => $fileData['width'],
            'height' => $fileData['height'],
            'date_uploaded' => $fileData['date_uploaded'] . ' UTC',
            'storage_adapter' => $fileData['storage_adapter']
        ];
    }

    /**
     * Get URL info
     *
     * @param string $url
     *
     * @return Array
     */
    public function getLink($link)
    {
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

        //   $filesAdapter = $this->storageAdaptersByRole['TEMP'];
          $fileData['name'] = "youtube_" . $video_id . ".jpg";
          $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
          $fileData['storage_adapter'] = $this->getConfig('adapter');
          $fileData['charset'] = '';

          // $img = Thumbnail::generateThumbnail('http://img.youtube.com/vi/' . $video_id . '/0.jpg', 'jpeg', $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
          // $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
          // Thumbnail::writeImage('jpg', $thumbnailTempName, $img, $settings['thumbnail_quality']);
          // if(!is_null($thumbnailTempName)) {
          //   $this->ThumbnailStorage->acceptFile($thumbnailTempName, 'THUMB_'.$fileData['name'], $filesAdapter['destination']);
          // }

          $linkContent = file_get_contents('http://img.youtube.com/vi/' . $video_id . '/0.jpg');
          $fileData['data'] = 'data:image/jpeg;base64,' . base64_encode($linkContent);

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

          $fileData['name'] = "vimeo_" . $video_id . ".jpg";
          $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
          $fileData['storage_adapter'] = $this->getConfig('adapter');
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

            // $img = Thumbnail::generateThumbnail($vimeo_thumb, 'jpeg', $settings['thumbnail_size'], $settings['thumbnail_crop_enabled']);
            // $thumbnailTempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
            // Thumbnail::writeImage('jpg', $thumbnailTempName, $img, $settings['thumbnail_quality']);
            // if(!is_null($thumbnailTempName)) {
            //   $this->ThumbnailStorage->acceptFile($thumbnailTempName, 'THUMB_'.$fileData['name'], $filesAdapter['destination']);
            // }
            $linkContent = file_get_contents($vimeo_thumb);
            $fileData['data'] = 'data:image/jpeg;base64,' . base64_encode($linkContent);
          } else {
            // Unable to get Vimeo details
            $fileData['title'] = "Unable to Retrieve Vimeo Title";
            $fileData['height'] = 340;
            $fileData['width'] = 560;
          }
        } else {
          //Arnt youtube or voimeo so try to curl photo and use uploadfile
          // $content = file_get_contents($link);
          // $tmpFile = tempnam(sys_get_temp_dir(), 'DirectusFile');
          // file_put_contents($tmpFile, $content);
          // $stripped_url = preg_replace('/\\?.*/', '', $link);
          // $realfilename = basename($stripped_url);
          // return self::acceptFile($tmpFile, $realfilename);
          // return self::acceptFile();
          $fileData = $this->getLinkInfo($link);
        }

        return $fileData;
    }

    /**
     * Copy base64 data into Directus Media
     *
     * @param string $fileData - base64 data
     * @param string $fileName - name of the file
     *
     * @return bool
     */
    public function saveData($fileData, $fileName)
    {
        if (strpos($fileData, 'data:') === 0) {
            $fileData = base64_decode(explode(',', $fileData)[1]);
        }

        // @TODO: merge with upload()
        $fileName = $this->getFileName($fileName);
        $filePath = $this->getConfig('root') . '/' . $fileName;

        try {
            $this->filesystem->getAdapter()->write($fileName, $fileData);//, new FlysystemConfig());}
            $this->createThumbnails($fileName);
        } catch (FileNotFoundException $e) {
            echo $e->getMessage();
            exit;
        } catch (\Exception $e) {
            echo $e->getMessage();
            exit;
        }

        $fileData = $this->getFileInfo($fileName);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileName);
        $fileData['name'] = basename($filePath);
        $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
        $fileData['storage_adapter'] = $this->config['adapter'];

        $fileData = array_merge($this->defaults, $fileData);

        return [
            'type' => $fileData['type'],
            'name' => $fileData['name'],
            'title' => $fileData['title'],
            'tags' => $fileData['tags'],
            'caption' => $fileData['caption'],
            'location' => $fileData['location'],
            'charset' => $fileData['charset'],
            'size' => $fileData['size'],
            'width' => $fileData['width'],
            'height' => $fileData['height'],
            'date_uploaded' => $fileData['date_uploaded'] . ' UTC',
            'storage_adapter' => $fileData['storage_adapter']
        ];
    }

    /**
     * Save embed url into Directus Media
     *
     * @param string $fileData - File Data/Info
     * @param string $fileName - name of the file
     *
     * @return bool
     */
    public function saveEmbedData($fileData)
    {
        if (!array_key_exists('type', $fileData) || strpos($fileData['type'], 'embed/') !== 0) {
            return false;
        }

        $fileName = isset($fileData['name']) ? $fileData['name'] : md5(time());
        $imageData = $this->saveData($fileData['data'], $fileName);

        $fileData['title'] = $imageData['title'];
        $fileData['storage_adapter'] = $imageData['storage_adapter'];

        return $fileData;
    }

    /**
     * Get file info
     *
     * @param string $path
     * @param bool if the $path is outside of the adapter root path.
     *
     * @return Array file info
     */
    public function getFileInfo($filePath, $outside = false)
    {
        $finfo = new \finfo(FILEINFO_MIME);
        // $type = explode('; charset=', $finfo->file($filePath));
        if ($outside === true) {
            $buffer = file_get_contents($filePath);
        } else {
            $buffer = $this->filesystem->getAdapter()->read($filePath);
        }
        $type = explode('; charset=', $finfo->buffer($buffer));
        $info = array('type' => $type[0], 'charset' => $type[1]);
        $typeTokens = explode('/', $info['type']);
        $info['format'] = $typeTokens[1]; // was: $this->format
        $info['size'] = strlen($buffer);//filesize($filePath);
        $info['width'] = null;
        $info['height'] = null;

        if($typeTokens[0] == 'image') {
            $meta = array();
            //$size = getimagesize($filePath, $meta);
            $size = [];
            $image = imagecreatefromstring($buffer);
            $size[] = imagesx($image);
            $size[] = imagesy($image);

            $info['width'] = $size[0];
            $info['height'] = $size[1];
            if (isset($meta["APP13"])) {
                $iptc = iptcparse($meta["APP13"]);

                if (isset($iptc['2#120'])) {
                    $info['caption'] = $iptc['2#120'][0];
                }
                if (isset($iptc['2#005']) && $iptc['2#005'][0] != '') {
                    $info['title'] = $iptc['2#005'][0];
                }
                if (isset($iptc['2#025'])) {
                    $info['tags'] = implode(',', $iptc['2#025']);
                }
                $location = array();
                if(isset($iptc['2#090']) && $iptc['2#090'][0] != '') {
                  $location[] = $iptc['2#090'][0];
                }
                if(isset($iptc["2#095"][0]) && $iptc['2#095'][0] != '') {
                  $location[] = $iptc['2#095'][0];
                }
                if(isset($iptc["2#101"]) && $iptc['2#101'][0] != '') {
                  $location[] = $iptc['2#101'][0];
                }
                $info['location'] = implode(', ', $location);
            }
        }
        return $info;
    }

    /**
     * Get file settings
     *
     * @param string $key - Optional setting key name
     *
     * @return mixed
     */
    public function getSettings($key = '')
    {
        if (!$key) {
            return $this->filesSettings;
        } else if (array_key_exists($key, $this->filesSettings)) {
            return $this->filesSettings[$key];
        }

        return false;
    }

    /**
     * Get filesystem config
     *
     * @param string $key - Optional config key name
     *
     * @return mixed
     */
    public function getConfig($key = '')
    {
        if (!$key) {
            return $this->config;
        } else if (array_key_exists($key, $this->config)) {
            return $this->config[$key];
        }

        return false;
    }

    /**
     * Create a thumbnail
     *
     * @param string $imageName - the name of the image. it must exists on files.
     *
     * @return void
     */
     // @TODO: it should return thumbnail info.
    private function createThumbnails($imageName)
    {
        $targetFileName = $this->getConfig('root') . '/' . $imageName;
        $info = pathinfo($targetFileName);

        if (in_array($info['extension'], array('jpg','jpeg','png','gif','tif', 'tiff', 'psd', 'pdf'))) {
            $targetContent = $this->filesystem->getAdapter()->read($imageName);
            $img = Thumbnail::generateThumbnail($targetContent, $info['extension'], $this->getSettings('thumbnail_size'), $this->getSettings('thumbnail_crop_enabled'));
            if($img) {
                //   $thumbnailTempName = $this->getConfig('root') . '/thumbs/THUMB_' . $imageName;
                $thumbnailTempName = 'thumbs/THUMB_' . $imageName;
                $thumbImg = Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $this->getSettings('thumbnail_quality'));
                $this->filesystem->getAdapter()->write($thumbnailTempName, $thumbImg);//, new FlysystemConfig());
            }
        }
    }

    /**
     * Creates a new file for Directus Media
     *
     * @param string $filePath
     * @param string $targetName
     *
     * @return Array file info
     */
    private function processUpload($filePath, $targetName)
    {
        // set true as $filePath it's outside adapter path
        // $filePath is on a temporary php directory
        $fileData = $this->getFileInfo($filePath, true);
        $mediaPath = $this->filesystem->getPath();

        $fileData['title'] = Formatting::fileNameToFileTitle($targetName);

        $targetName = $this->getFileName($targetName);
        $finalPath = rtrim($mediaPath, '/').'/'.$targetName;
        $this->filesystem->getAdapter()->write($targetName, file_get_contents($filePath));

        $fileData['name'] = basename($finalPath);
        $fileData['date_uploaded'] = gmdate('Y-m-d H:i:s');
        $fileData['storage_adapter'] = $this->config['adapter'];

        return $fileData;
    }

    /**
     * Sanitize title name from file name
     *
     * @param string $fileName
     *
     * @return string
     */
    private function sanitizeName($fileName)
    {
        // do not start with dot
        $fileName = preg_replace('/^\./', 'dot-', $fileName);
        $fileName = str_replace(' ', '_', $fileName);

        return $fileName;
    }

    /**
     * Add suffix number to file name if already exists.
     *
     * @param string $fileName
     * @param string $targetPath
     * @param int    $attempt - Optional
     *
     * @return bool
     */
    private function uniqueName($fileName, $targetPath, $attempt = 0)
    {
        $info = pathinfo($fileName);
        $ext = $info['extension'];
        $name = basename($fileName, ".$ext");

        $name = $this->sanitizeName($name);

        $fileName = "$name.$ext";
        if($this->filesystem->exists($fileName)) {
            $matches = array();
            $trailingDigit = '/\-(\d)\.('.$ext.')$/';
            if(preg_match($trailingDigit, $fileName, $matches)) {
                // Convert "fname-1.jpg" to "fname-2.jpg"
                $attempt = 1 + (int) $matches[1];
                $newName = preg_replace($trailingDigit, "-{$attempt}.$ext", $fileName);
                $fileName = basename($newName);
            } else {
                if ($attempt) {
                    $name = rtrim($name, $attempt);
                    $name = rtrim($name, '-');
                }
                $attempt++;
                $fileName = $name . '-' . $attempt . '.' . $ext;
            }
            return $this->uniqueName($fileName, $targetPath, $attempt);
        }

        return $fileName;
    }

    /**
     * Get file name based on file naming setting
     *
     * @param string $fileName
     *
     * @return string
     */
    private function getFileName($fileName)
    {
        switch($this->getSettings('file_naming')) {
            case 'file_hash':
                $fileName = $this->hashFileName($fileName);
                break;
        }

        return $this->uniqueName($fileName, $this->filesystem->getPath());
    }

    /**
     * Hash file name
     *
     * @param string $fileName
     *
     * @return string
     */
    private function hashFileName($fileName)
    {
        $ext = pathinfo($fileName, PATHINFO_EXTENSION);
        $fileHashName = md5(microtime() . $fileName);
        return $fileHashName.'.'.$ext;
    }

    /**
     * Get string between two string
     *
     * @param string $string
     * @param string $start
     * @param string $end
     *
     * @return string
     */
    private function get_string_between($string, $start, $end)
    {
      $string = " ".$string;
      $ini = strpos($string,$start);
      if ($ini == 0) return "";
      $ini += strlen($start);
      $len = strpos($string,$end,$ini) - $ini;
      return substr($string,$ini,$len);
    }

    /**
     * Get URL info
     *
     * @param string $link
     *
     * @return Array
     */
    public function getLinkInfo($link)
    {
        $fileData = array();

        $urlHeaders = get_headers($link, 1);
        $urlInfo = pathinfo($link);

        // if(in_array($urlInfo['extension'], array('jpg','jpeg','png','gif','tif','tiff'))) {
        if (strpos($urlHeaders['Content-Type'], 'image/') === 0) {
            list($width, $height) = getimagesize($link);
        }

        $linkContent = file_get_contents($link);
        $url = 'data:' . $urlHeaders['Content-Type'] . ';base64,' . base64_encode($linkContent);

        $fileData = array_merge($fileData, array(
            'type' => $urlHeaders['Content-Type'],
            'name' => $urlInfo['basename'],
            'title' => $urlInfo['filename'],
            'charset' => 'binary',
            'size' => isset($urlHeaders['Content-Length']) ? $urlHeaders['Content-Length'] : 0,
            'width' => $width,
            'height' => $height,
            'data' => $url,
            'url' => ($width) ? $url : ''
        ));

        return $fileData;
    }
}