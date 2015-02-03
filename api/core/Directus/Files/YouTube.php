<?php

namespace Directus\Files;

use Directus\Bootstrap;

class YouTube {

    // @todo put in settings
    protected static $thumbnailUrl = "http://img.youtube.com/vi/%s/0.jpg";

    public static function getYouTubeIdFromUrl($url) {
        preg_match("#(?<=v=)[a-zA-Z0-9-]+(?=&)|(?<=v\/)[^&\n]+(?=\?)|(?<=v=)[^&\n]+|(?<=youtu.be/)[^&\n]+#", $url, $id);
        if(count($id)) {
            return current($id);
        }
        return false;
    }

    public static function writeThumbnail($videoId, $destination) {
        $thumbnailUrl = sprintf(self::$thumbnailUrl, $videoId);
        // Download the file
        $ch = curl_init($thumbnailUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $data = curl_exec($ch);
        curl_close($ch);
        return file_put_contents($destination, $data);
    }

}
