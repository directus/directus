<?php

namespace Directus\Filesystem;

use Directus\Bootstrap;
use Directus\Exception\Exception;
use Directus\Filesystem\Exception\ForbiddenException;
use Directus\Util\DateUtils;
use Directus\Util\Formatting;

class Files
{
    /**
     * @var array
     */
    private $config = [];

    /**
     * @var array
     */
    private $filesSettings = [];

    /**
     * @var Filesystem
     */
    private $filesystem = null;

    /**
     * @var array
     */
    private $defaults = [
        'caption' => '',
        'tags' => '',
        'location' => ''
    ];

    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected $emitter;

    public function __construct($filesystem, $config, $settings, $emitter)
    {
        $this->filesystem = $filesystem;
        $this->config = $config;
        $this->emitter = $emitter;
        $this->filesSettings = $settings;
    }

    // @TODO: remove exists() and rename() method
    // and move it to Directus\Filesystem Wrapper
    public function exists($path)
    {
        return $this->filesystem->getAdapter()->has($path);
    }

    public function rename($path, $newPath)
    {
        return $this->filesystem->getAdapter()->rename($path, $newPath);
    }

    public function delete($file)
    {
        if ($this->exists($file['name'])) {
            $this->emitter->run('files.deleting', [$file]);
            $this->filesystem->getAdapter()->delete($file['name']);
            $this->emitter->run('files.deleting:after', [$file]);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        if ($ext) {
            $thumbPath = 'thumbs/' . $file['id'] . '.' . $ext;
            if ($this->exists($thumbPath)) {
                $this->emitter->run('files.thumbnail.deleting', [$file]);
                $this->filesystem->getAdapter()->delete($thumbPath);
                $this->emitter->run('files.thumbnail.deleting:after', [$file]);
            }
        }
    }

    /**
     * Copy $_FILES data into directus media
     *
     * @param array $file $_FILES data
     *
     * @return array directus file info data
     */
    public function upload(array $file)
    {
        $filePath = $file['tmp_name'];
        $fileName = $file['name'];

        $fileData = array_merge($this->defaults, $this->processUpload($filePath, $fileName));
        $this->createThumbnails($fileData['name']);

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
            //    @TODO: Returns date in ISO 8601 Ex: 2016-06-06T17:18:20Z
            //    see: https://en.wikipedia.org/wiki/ISO_8601
            'date_uploaded' => $fileData['date_uploaded'],// . ' UTC',
            'storage_adapter' => $fileData['storage_adapter']
        ];
    }

    /**
     * Get URL info
     *
     * @param string $url
     *
     * @return array
     */
    public function getLink($url)
    {
        // @TODO: use oEmbed
        // @TODO: better provider url validation
        // checking for 'youtube.com' for a valid youtube video is wrong
        // we can also be using youtube.com/img/a/youtube/image.jpg
        // which should fallback to ImageProvider
        // instead checking for a url with 'youtube.com/watch' with v param or youtu.be/
        $embedManager = Bootstrap::get('embedManager');
        try {
            $info = $embedManager->parse($url);
        } catch (\Exception $e) {
            $info = $this->getImageFromURL($url);
        }

        if ($info) {
            $info['date_uploaded'] = DateUtils::now();
            $info['storage_adapter'] = $this->getConfig('adapter');
            $info['charset'] = isset($info['charset']) ? $info['charset'] : '';
        }

        return $info;
    }

    /**
     * Gets the mime-type from the content type
     *
     * @param $contentType
     *
     * @return string
     */
    protected function getMimeTypeFromContentType($contentType)
    {
        // NOTE: When loading data from a url some requests responds with multiple content type
        if (is_array($contentType)) {
            foreach ($contentType as $type) {
                if (strpos($type, 'image/') === 0) {
                    $contentType = $type;
                    break;
                }
            }
        }

        // split the data type if it has charset or boundaries set
        // ex: image/jpg;charset=UTF8
        if (strpos($contentType, ';') !== false) {
            $contentType = array_map('trim', explode(';', $contentType));
        }

        if (is_array($contentType)) {
            $contentType = $contentType[0];
        }

        return $contentType;
    }

    /**
     * Get Image from URL
     *
     * @param $url
     * @return array
     */
    protected function getImageFromURL($url)
    {
        stream_context_set_default([
            'http' => [
                'method' => 'HEAD'
            ]
        ]);

        $urlHeaders = get_headers($url, 1);

        stream_context_set_default([
            'http' => [
                'method' => 'GET'
            ]
        ]);

        $info = [];

        $contentType = $this->getMimeTypeFromContentType($urlHeaders['Content-Type']);

        if (strpos($contentType, 'image/') === false) {
            return $info;
        }

        $urlPath = parse_url($url, PHP_URL_PATH);
        $urlInfo = pathinfo($urlPath);
        $content = file_get_contents($url);
        if (!$content) {
            return $info;
        }

        list($width, $height) = getimagesizefromstring($content);

        $data = 'data:' . $contentType . ';base64,' . base64_encode($content);
        $info['title'] = $urlInfo['filename'];
        $info['name'] = $urlInfo['basename'];
        $info['size'] = isset($urlHeaders['Content-Length']) ? $urlHeaders['Content-Length'] : 0;
        $info['type'] = $contentType;
        $info['width'] = $width;
        $info['height'] = $height;
        $info['data'] = $data;
        $info['charset'] = 'binary';

        return $info;
    }

    /**
     * Get base64 data information
     *
     * @param $data
     *
     * @return array
     */
    public function getDataInfo($data)
    {
        if (strpos($data, 'data:') === 0) {
            $parts = explode(',', $data);
            $data = $parts[1];
        }

        $info = $this->getFileInfoFromData(base64_decode($data));

        return array_merge(['data' => $data], $info);
    }

    /**
     * Copy base64 data into Directus Media
     *
     * @param string $fileData - base64 data
     * @param string $fileName - name of the file
     *
     * @return array
     */
    public function saveData($fileData, $fileName)
    {
        $fileData = base64_decode($this->getDataInfo($fileData)['data']);

        // @TODO: merge with upload()
        $fileName = $this->getFileName($fileName);
        $filePath = $this->getConfig('root') . '/' . $fileName;

        $this->emitter->run('files.saving', ['name' => $fileName, 'size' => strlen($fileData)]);
        $this->write($fileName, $fileData);
        $this->emitter->run('files.saving:after', ['name' => $fileName, 'size' => strlen($fileData)]);

        unset($fileData);
        $this->createThumbnails($fileName);

        $fileData = $this->getFileInfo($fileName);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileName);
        $fileData['name'] = basename($filePath);
        $fileData['date_uploaded'] = DateUtils::now();
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
            //    @TODO: Returns date in ISO 8601 Ex: 2016-06-06T17:18:20Z
            //    see: https://en.wikipedia.org/wiki/ISO_8601
            'date_uploaded' => $fileData['date_uploaded'],// . ' UTC',
            'storage_adapter' => $fileData['storage_adapter']
        ];
    }

    /**
     * Save embed url into Directus Media
     *
     * @param string $fileData - File Data/Info
     * @param string $fileName - name of the file
     *
     * @return Array - file info
     */
    public function saveEmbedData($fileData)
    {
        if (!array_key_exists('type', $fileData) || strpos($fileData['type'], 'embed/') !== 0) {
            return false;
        }

        $fileName = isset($fileData['name']) ? $fileData['name'] : md5(time());
        $imageData = $this->saveData($fileData['data'], $fileName);

        $keys = ['date_uploaded', 'storage_adapter'];
        foreach ($keys as $key) {
            if (array_key_exists($key, $imageData)) {
                $fileData[$key] = $imageData[$key];
            }
        }

        return $fileData;
    }

    /**
     * Get file info
     *
     * @param string $path - file path
     * @param bool $outside - if the $path is outside of the adapter root path.
     *
     * @throws \RuntimeException
     *
     * @return array file information
     */
    public function getFileInfo($path, $outside = false)
    {
        if ($outside === true) {
            $buffer = file_get_contents($path);
        } else {
            $buffer = $this->filesystem->getAdapter()->read($path);
        }

        return $this->getFileInfoFromData($buffer);
    }

    public function getFileInfoFromData($data)
    {
        if (!class_exists('\finfo')) {
            throw new \RuntimeException('PHP File Information extension was not loaded.');
        }

        $finfo = new \finfo(FILEINFO_MIME);
        $type = explode('; charset=', $finfo->buffer($data));

        $mime = $type[0];
        $charset = $type[1];
        $typeTokens = explode('/', $mime);

        $info = [
            'type' => $mime,
            'format' => $typeTokens[1],
            'charset' => $charset,
            'size' => strlen($data),
            'width' => null,
            'height' => null
        ];

        if ($typeTokens[0] == 'image') {
            $meta = [];
            // @TODO: use this as fallback for finfo?
            $imageInfo = getimagesizefromstring($data, $meta);

            $info['width'] = $imageInfo[0];
            $info['height'] = $imageInfo[1];

            if (isset($meta['APP13'])) {
                $iptc = iptcparse($meta['APP13']);

                if (isset($iptc['2#120'])) {
                    $info['caption'] = $iptc['2#120'][0];
                }

                if (isset($iptc['2#005']) && $iptc['2#005'][0] != '') {
                    $info['title'] = $iptc['2#005'][0];
                }

                if (isset($iptc['2#025'])) {
                    $info['tags'] = implode(',', $iptc['2#025']);
                }

                $location = [];
                if (isset($iptc['2#090']) && $iptc['2#090'][0] != '') {
                    $location[] = $iptc['2#090'][0];
                }

                if (isset($iptc['2#095'][0]) && $iptc['2#095'][0] != '') {
                    $location[] = $iptc['2#095'][0];
                }

                if (isset($iptc['2#101']) && $iptc['2#101'][0] != '') {
                    $location[] = $iptc['2#101'][0];
                }

                $info['location'] = implode(', ', $location);
            }
        }

        unset($data);

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

        // @TODO: Add method to check whether a file can generate a thumbnail
        if (in_array(strtolower($info['extension']), ['jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'psd', 'pdf'])) {
            $targetContent = $this->filesystem->getAdapter()->read($imageName);
            $img = Thumbnail::generateThumbnail($targetContent, $info['extension'], $this->getSettings('thumbnail_size'), $this->getSettings('thumbnail_crop_enabled'));
            if ($img) {
                $thumbnailTempName = 'thumbs/THUMB_' . $imageName;
                $thumbImg = Thumbnail::writeImage($info['extension'], $thumbnailTempName, $img, $this->getSettings('thumbnail_quality'));
                $this->emitter->run('files.thumbnail.saving', ['name' => $imageName, 'size' => strlen($thumbImg)]);
                $this->write($thumbnailTempName, $thumbImg);
                $this->emitter->run('files.thumbnail.saving:after', ['name' => $imageName, 'size' => strlen($thumbImg)]);
            }
        }
    }

    /**
     * Writes the given data in the given location
     *
     * @param $location
     * @param $data
     *
     * @throws \RuntimeException
     */
    public function write($location, $data)
    {
        $throwException = function () use ($location) {
            throw new ForbiddenException(sprintf('No permission to write: %s', $location));
        };

        try {
            if (!$this->filesystem->getAdapter()->write($location, $data)) {
                $throwException();
            }
        } catch (\Exception $e) {
            $throwException();
        }
    }

    /**
     * Reads and returns data from the given location
     *
     * @param $location
     *
     * @return bool|false|string
     *
     * @throws \Exception
     */
    public function read($location)
    {
        try {
            return $this->filesystem->getAdapter()->read($location);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Creates a new file for Directus Media
     *
     * @param string $filePath
     * @param string $targetName
     *
     * @return array file info
     */
    private function processUpload($filePath, $targetName)
    {
        // set true as $filePath it's outside adapter path
        // $filePath is on a temporary php directory
        $fileData = $this->getFileInfo($filePath, true);
        $mediaPath = $this->filesystem->getPath();

        $fileData['title'] = Formatting::fileNameToFileTitle($targetName);

        $targetName = $this->getFileName($targetName);
        $finalPath = rtrim($mediaPath, '/') . '/' . $targetName;
        $data = file_get_contents($filePath);

        $this->emitter->run('files.saving', ['name' => $targetName, 'size' => strlen($data)]);
        $this->write($targetName, $data);
        $this->emitter->run('files.saving:after', ['name' => $targetName, 'size' => strlen($data)]);

        $fileData['name'] = basename($finalPath);
        $fileData['date_uploaded'] = DateUtils::now();
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
     * @param int $attempt - Optional
     *
     * @return bool
     */
    private function uniqueName($fileName, $targetPath, $attempt = 0)
    {
        $info = pathinfo($fileName);
        // @TODO: this will fail when the filename doesn't have extension
        $ext = $info['extension'];
        $name = basename($fileName, ".$ext");

        $name = $this->sanitizeName($name);

        $fileName = "$name.$ext";
        if ($this->filesystem->exists($fileName)) {
            $matches = [];
            $trailingDigit = '/\-(\d)\.(' . $ext . ')$/';
            if (preg_match($trailingDigit, $fileName, $matches)) {
                // Convert "fname-1.jpg" to "fname-2.jpg"
                $attempt = 1 + (int)$matches[1];
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
        switch ($this->getSettings('file_naming')) {
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
        return $fileHashName . '.' . $ext;
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
        $string = ' ' . $string;
        $ini = strpos($string, $start);
        if ($ini == 0) return '';
        $ini += strlen($start);
        $len = strpos($string, $end, $ini) - $ini;
        return substr($string, $ini, $len);
    }

    /**
     * Get URL info
     *
     * @param string $link
     *
     * @return array
     */
    public function getLinkInfo($link)
    {
        $fileData = [];
        $width = 0;
        $height = 0;

        $urlHeaders = get_headers($link, 1);
        $contentType = $this->getMimeTypeFromContentType($urlHeaders['Content-Type']);

        if (strpos($contentType, 'image/') === 0) {
            list($width, $height) = getimagesize($link);
        }

        $urlInfo = pathinfo($link);
        $linkContent = file_get_contents($link);
        $url = 'data:' . $contentType . ';base64,' . base64_encode($linkContent);

        $fileData = array_merge($fileData, [
            'type' => $contentType,
            'name' => $urlInfo['basename'],
            'title' => $urlInfo['filename'],
            'charset' => 'binary',
            'size' => isset($urlHeaders['Content-Length']) ? $urlHeaders['Content-Length'] : 0,
            'width' => $width,
            'height' => $height,
            'data' => $url,
            'url' => ($width) ? $url : ''
        ]);

        return $fileData;
    }
}
