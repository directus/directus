<?php

namespace Directus\Embed\Provider;

class VimeoProvider extends AbstractProvider
{
    protected $name = 'Vimeo';

    public function getProviderType()
    {
        return 'video';
    }

    /**
     * @inheritDoc
     */
    public function validateURL($url)
    {
        return strpos($url, 'vimeo.com') !== false;
    }

    /**
     * @inheritdoc
     */
    public function getFormatUrl()
    {
        return 'https://vimeo.com/{{embed}}';
    }

    /**
     * @inheritDoc
     */
    protected function parseURL($url)
    {
        // Get ID from URL
        preg_match('/vimeo\.com\/([0-9]{1,10})/', $url, $matches);
        $videoID = isset($matches[1]) ? $matches[1] : null;

        // Can't find the video ID
        if (!$videoID) {
            throw new \Exception('Vimeo id not detected');
        }

        return $videoID;
    }

    /**
     * Fetch Video information
     * @param $videoID
     * @return array
     */
    protected function fetchInfo($videoID)
    {
        $info = [];

        $info['title'] = $this->getDefaultTitle($videoID);
        $info['filesize'] = 0;
        $info['width'] = 560;
        $info['height'] = 540;

        // Get Data
        $url = 'http://vimeo.com/api/v2/video/' . $videoID . '.json';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
        $content = curl_exec($ch);
        curl_close($ch);

        $array = json_decode($content, true);
        if (!$array) {
            return $info;
        }

        $result = $array[0];
        $info['title'] = $result['title'];
        $info['description'] = strip_tags($result['description']);
        $info['duration'] = $result['duration'];
        $info['height'] = $result['height'];
        $info['width'] = $result['width'];
        $info['tags'] = $result['tags'];
        $info['data'] = $this->getThumbnail($result['thumbnail_large']);

        return $info;
    }

    /**
     * Fetch Video thumbnail data
     * @param $thumb - url
     * @return string
     */
    protected function getThumbnail($thumb)
    {
        $content = @file_get_contents($thumb);
        $thumbnail = '';

        if ($content) {
            $thumbnail = 'data:image/jpeg;base64,' . base64_encode($content);
        }

        return $thumbnail;
    }

    /**
     * @inheritDoc
     */
    protected function getFormatTemplate()
    {
        return '<iframe src="//player.vimeo.com/video/{{embed}}?title=false&amp;byline=false&amp;portrait=false&amp;color=FFFFFF" width="{{width}}" height="{{height}}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
    }
}
