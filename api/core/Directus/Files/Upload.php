<?php

namespace Directus\Files;

/**
 * Directus - awesome content management framework for everyone
 *
 * @copyright     2012 RANGER
 * @link                http://www.getdirectus.com
 * @license         http://www.getdirectus.com/license
 * @version         6.0.0
 *
 * This file is part of Directus.
 *
 * Directus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Directus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.    See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Directus. If not, see <http://www.gnu.org/licenses/>.
 */

use Directus\Bootstrap;

/**
 * Files
 *
 * This class takes care of media uploads
 *
 * @package Directus
 * @since     6.0.0
 */
class Upload {

    private $resources_path;
    private $thumbnails_path;
    private $temp_path;
    private $formats = array('image/jpeg','image/gif', 'image/png', 'application/pdf');
    private $tmp_name;
    private $name;
    private $target_file;
    private $md5 = false;
    private $thumb_size = 200;
    private $quality = 50;
    private $is_curl;

    public function __construct($file, $resources_path) {
        $this->resources_path = $resources_path;
        $this->thumbnails_path = $resources_path . 'thumbnail';
        $this->temp_path = $resources_path . 'temp/';

        // File is a URL, cURL it!
        if (gettype($file) == "string") {
            // Is Youtube URL?
            $youtubeId = $this->getYoutubeIdFromUrl($file);
            if ($youtubeId) {
                $this->name = "$youtubeId.jpg";
                $this->tmp_name = $this->curl_image("http://img.youtube.com/vi/$youtubeId/0.jpg");
                $type = 'youtube';
            }
            // External file resource url
            else {
                $this->name = basename($file);
                $this->tmp_name = $this->curl_image($file);
                $type = 'external';
            }
        } else {
            $this->tmp_name = $file['tmp_name'];
            $this->name = $file['name'];
            $type = 'uploaded';
        }

        $this->get_info();

        if (!in_array($this->info['type'], $this->formats))
          throw new \Exception("The type is not supported!");

        $this->target_file = $this->unique_name();

        if('application/pdf' == $this->info['type']) {
            if (extension_loaded('imagick')) {
                // extract first page of pdf & make thumbnail
            }
        } else {
            // Genereate & save thumbnail
            $img = $this->open_image();
            $img = self::make_thumb($img, $this->thumb_size, $this->format);
            $this->save_image($img);
            imagedestroy($img);
        }

        switch($type) {
            case 'youtube':
                $this->info['type'] = 'embed/youtube';
                $this->info['embed_id'] = $youtubeId;
                break;
            case 'external':
                rename($this->tmp_name, $this->target_file);
                $this->info['src'] = $file;
                break;
            case 'uploaded':
                move_uploaded_file($this->tmp_name, $this->target_file);
                break;
        }
    }

    public function data() {
        // Store new name in data object
        $this->info['name'] = basename($this->target_file);
        $this->info['date_uploaded'] = gmdate('Y-m-d H:i:s');
        if (!isset($this->info['title'])) {
            $this->info['title'] = $this->make_title($this->info['name']);
        }
        return $this->info;
    }

    private function getYoutubeIdFromUrl($url) {
        preg_match("#(?<=v=)[a-zA-Z0-9-]+(?=&)|(?<=v\/)[^&\n]+(?=\?)|(?<=v=)[^&\n]+|(?<=youtu.be/)[^&\n]+#", $url, $id);
        if(count($id))
            return current($id);
        return false;
    }

    private function make_title($name) {
        $info = pathinfo($name);
        $ext = $info['extension'];
        $name = basename($name,'.'.$ext);
        $name = strtolower($name);
        $name = str_replace(array('_','-'),array(' ',' '),$name);
        $name = ucwords($name);
        return $name;
    }

    // refactor @done
    private function unique_name($attempt=0) {
        $info = pathinfo($this->name);
        $path = $this->resources_path;
        $ext = $info['extension'];
        $name = basename($this->name,'.'.$ext);

        // Strip whitespace
        $name = str_replace(' ', '_', $name);

        // Hash the filename
        if ($this->md5) {
            $name = md5($name);
        }

        $file = $path.'/'.$name.'.'.$ext;

        if (file_exists($file)) {
            $matches = array();
            $trailingDigit = '/\-(\d)\.('.$ext.')$/';
            if(preg_match($trailingDigit, $file, $matches)) {
                // Convert "fname-1.jpg" to "fname-2.jpg"
                $attempt = 1 + (int) $matches[1];
                $newName = preg_replace($trailingDigit, "-{$attempt}.$ext", $file);
                $this->name = basename($newName);
            } else {
                if ($attempt) {
                    $name = rtrim($name, $attempt);
                    $name = rtrim($name, '-');
                }
                $attempt++;
                $this->name = $name . '-' . $attempt . '.' . $ext;
            }
            return $this->unique_name($attempt);
        }

        return $file;
    }

    // refactor @done
    private function get_info() {
        $file = $this->tmp_name;
        $finfo = new \finfo(FILEINFO_MIME);
        $type = explode('; charset=', $finfo->file($file));
        $info = array('type'=>$type[0], 'charset'=>$type[1]);
        $info['size'] = filesize($file);

        $type_str = explode('/', $info['type']);
        $this->format = $type_str[1];

        $info['width'] = null;
        $info['height'] = null;

        if ($type_str[0] == 'image') {
            $size = getimagesize($file, $meta);
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
        $this->info = $info;
    }

    public static function make_thumb($img, $thumb_size, $format) {
        $w = imagesx($img);
        $h = imagesy($img);
        $aspect_ratio = $w / $h;

        // portrait (or square) mode, maximize height
        if ($aspect_ratio <= 1) {
            $newH = $thumb_size;
            $newW = $thumb_size * $aspect_ratio;
        }
        // landscape mode, maximize width
        if ($aspect_ratio > 1) {
            $newW = $thumb_size;
            $newH = $thumb_size / $aspect_ratio;
        }

        $imgResized = imagecreatetruecolor($newW, $newH);

        // Preserve transperancy for gifs and pngs
        if ($format == 'gif' || $format == 'png') {
            imagealphablending($imgResized, false);
            imagesavealpha($imgResized,true);
            $transparent = imagecolorallocatealpha($imgResized, 255, 255, 255, 127);
            imagefilledrectangle($imgResized, 0, 0, $newW, $newH, $transparent);
        }

        imagecopyresampled($imgResized, $img, 0, 0, 0, 0, $newW, $newH, $w, $h);
        imagedestroy($img);
        return $imgResized;
    }

    private function open_image() {
        switch($this->format) {
            case 'jpg':
            case 'jpeg':
                return imagecreatefromjpeg($this->tmp_name);
            case 'gif':
                return imagecreatefromgif($this->tmp_name);
            case 'png':
                return imagecreatefrompng($this->tmp_name);
        }
        throw new \Exception("Invalid format:" . $this->format);
    }

    private function save_image($img) {
        $path = $this->thumbnails_path . '/' . basename($this->unique_name());
        switch($this->format) {
            case 'jpg':
            case 'jpeg':
                return imagejpeg($img, $path, $this->quality);
                break;
            case 'gif':
                return imagegif($img, $path);
                break;
            case 'png':
                return imagepng($img, $path);
                break;
        }
        throw new \Exception("The image type is not supported!");
    }

    private function curl_image($file) {
        // pseudo unique temp name
        $tmp_name = $this->temp_path . time() . $this->name;
        $ch = curl_init($file);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $data = curl_exec($ch);
        curl_close($ch);
        file_put_contents($tmp_name, $data);
        return $tmp_name;
    }
}