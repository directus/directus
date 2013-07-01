<?php

namespace Directus\Media\Upload\Adapter;

abstract class Adapter {

    protected $target = '';

    // @todo define via install config
    protected $allowedFormats = array('image/jpeg','image/gif', 'image/png', 'application/pdf');
    protected $imageFormats = array('image/jpeg','image/gif', 'image/png');

    /**
     */
    private abstract function writeFile($file) {}

    /**
     * @return bool
     */
    private abstract function fileExists($fileName) {}

    /**
     * @param  array $file One item from the $_FILES superglobal.
     */
    public function acceptUpload($file) {
        $uploadInfo = $this->getUploadInfo($file['tmp_name']);
        // Enforce format rules
        if(!in_array($uploadInfo['type'], $this->allowedFormats)) {
            throw new \Exception("The type is not supported!");
            // @todo use Directus\Media\Upload\Exception
        }
        // Generate image thumbnails
        if(in_array($uploadInfo['type'], $this->allowedFormats)) {
            // generate thumbnail
        }
    }

    /**
     * Designate the generic upload path.
     * @param string $target Generic target upload "path". 
     */
    public function setTarget($target) {
        $this->target = $target;
        return $this;
    }

    /**
     * Retrieve the generic upload path.
     * @param string $target Generic target upload "path".
     */
    public function getTarget() {
        if(empty($this->target)) {
            throw new \RuntimeException('Must call setTarget before calling getTarget');
        }
        return $this->target;
    }

    private function uniqueName($filename, $attempt = 0, $md5 = false) {
        $tokens = explode('.', $filename);
        $ext = array_slice(-1, $tokens);
        $name = basename($filename,".$ext");
        $name = str_replace(' ', '_', $name);
        if ($md5) {
            $name = md5($name);
        }
        $filename = "$name.$ext";
        if($this->fileExists($filename)) {
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
            return $this->uniqueName($filename, $attempt, $md5);
        }
        return $filename;
    }

    private function getUploadInfo($filepath) {
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
                    $info['tags'] = implode($iptc['2#025'], ',');
                }
            }
        }
        return $info;
    }

}