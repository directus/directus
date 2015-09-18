<?php

namespace Directus\Files\Storage\Adapter;

abstract class Adapter {

    /**
     * The array representation of the corresponding row in directus_storage_adapters
     * @var array
     */
    protected $settings = array();

    /**
     * Most storage adapters will depend on certain metadata which is unique to that
     * service, namely API credentials. Specify those parameter names here.
     * @var array
     */
    protected static $requiredParams = array();

    /**
     * Most storage adapters will depend upon the presence of some class dependencies.
     * Specify their fully-qualified namespaced class names in this array.
     * e.g.
     *     array("\\Aws\\S3\\S3Client"); // or...
     *     array("\\OpenCloud\\Rackspace");
     * @var array
     */
    protected static $requiredClasses = array();

    // @todo define via install config
    protected $allowedFormats = array('image/jpeg','image/gif', 'image/png', 'application/pdf');
    protected $imageFormats = array('image/jpeg','image/gif', 'image/png');

    /**
     * @param array $settings One record of directus_storage_adapters, where $settings['params'] is
     *                        an array (e.g. json_decode'd)
     */
    public function __construct(array $settings = array()) {
        $this->settings = $settings;
        // Enforce required adapter parameters
        if(!empty(static::$requiredParams)) {
            $missingParamKeys = array_diff_key(static::$requiredParams, array_keys($this->settings['params']));
            if(count($missingParamKeys)) {
                throw new \RuntimeException(__CLASS__ . " requires " . count(static::$requiredParams)
                 . " parameters to be defined (missing " . implode(",", $missingParamKeys) . ")");
            }
        }
        // Enforce presence of required class dependencies
        foreach(static::$requiredClasses as $className) {
            if(!class_exists($className)) {
                throw new \RuntimeException("Missing dependency $className");
            }
        }
    }

    /**
     * Write file to storage.
     * @param  string $localFile      The local path of the source file.
     * @param  string $targetFileName The intended target file name.
     * @param  mixed $destination    The destination where we'll write the file. Varies depending on adapter
     * implementation.
     * @return [type]                 [description]
     */
    protected abstract function writeFile($localFile, $targetFileName, $destination);

    /**
     * Does the specified file exist in the target location?
     * @param  string $fileName      The file we're checking for.
     * @param  mixed $destination    The destination where we'll check for this file. Varies depending on adapter
     * implementation.
     * @return bool
     */
    public abstract function fileExists($fileName, $destination);

    /**
     * Can't make this abstract right off the bat since it will break the one CDN adapter we have right now
     * @param  string $fileName
     * @param  string $destination
     * @return string               File contents
     */
    public abstract function getFileContents($fileName, $destination);

    public function getSettings() {
        return $this->settings;
    }

    /**
     * @param  string $localFile      The local path of the source file.
     * @param  string $targetFileName The intended target file name.
     * @param  mixed $destination    The destination where we'll write the file. Varies depending on adapter
     * implementation. Passed to Adapter#writeFile.
     * @return [type]                 [description]
     */
    public function acceptFile($localFile, $targetFileName, $destination) {
        $uploadInfo = $this->getUploadInfo($localFile);
        // Refused disallowed formats
        if(!in_array($uploadInfo['type'], $this->allowedFormats)) {
            // @todo use Directus\Files\Upload\Exception
            // @todo the filters are currently turned off, please turned on again at some point
            // throw new \Exception("The type is not supported!");
        }
        $uniqueFileName = $this->uniqueName($targetFileName, $destination);
        $this->writeFile($localFile, $uniqueFileName, $destination);
        return $this->joinPaths($destination, $uniqueFileName);
    }

    public function getUploadInfo($filepath) {
        $finfo = new \finfo(FILEINFO_MIME);
        $type = explode('; charset=', $finfo->file($filepath));
        $info = array('type' => $type[0], 'charset' => $type[1]);
        $typeTokens = explode('/', $info['type']);
        $info['format'] = $typeTokens[1]; // was: $this->format
        $info['size'] = filesize($filepath);
        $info['width'] = null;
        $info['height'] = null;
        if($typeTokens[0] == 'image') {
            $meta = array();
            $size = getimagesize($filepath, $meta);

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

    public function getLinkInfo($link) {
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

    public function joinPaths($path, $file) {
        $file = ltrim($file, '/');
        $path = rtrim($path, '/');
        return implode('/', array($path, $file));
    }

    private function uniqueName($filename, $destination, $attempt = 0) {
        $info = pathinfo($filename);
        $ext = $info['extension'];
        $name = basename($filename, ".$ext");
        // do not start with dot
        $name = preg_replace('/^\./', 'dot-', $name);
        $name = str_replace(' ', '_', $name);
        $filename = "$name.$ext";
        if($this->fileExists($filename, $destination)) {
            $matches = array();
            $trailingDigit = '/\-(\d)\.('.$ext.')$/';
            if(preg_match($trailingDigit, $filename, $matches)) {
                // Convert "fname-1.jpg" to "fname-2.jpg"
                $attempt = 1 + (int) $matches[1];
                $newName = preg_replace($trailingDigit, "-{$attempt}.$ext", $filename);
                $filename = basename($newName);
            } else {
                if ($attempt) {
                    $name = rtrim($name, $attempt);
                    $name = rtrim($name, '-');
                }
                $attempt++;
                $filename = $name . '-' . $attempt . '.' . $ext;
            }
            return $this->uniqueName($filename, $destination, $attempt);
        }
        return $filename;
    }

}