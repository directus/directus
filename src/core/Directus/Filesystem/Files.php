<?php

namespace Directus\Filesystem;

use Directus\Application\Application;
use function Directus\filename_put_ext;
use function Directus\generate_uuid5;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Util\Formatting;
use Directus\Util\MimeTypeUtils;

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
        'description' => '',
        'tags' => '',
        'location' => ''
    ];

    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected $emitter;

    public function __construct($filesystem, $config, array $settings, $emitter)
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

    public function rename($path, $newPath, $replace = false)
    {
        if ($replace === true && $this->filesystem->exists($newPath)) {
            $this->filesystem->getAdapter()->delete($newPath);
        }

        return $this->filesystem->getAdapter()->rename($path, $newPath);
    }

    public function delete($file)
    {
        if ($this->exists($file['filename'])) {
            $this->emitter->run('file.delete', [$file]);
            $this->filesystem->getAdapter()->delete($file['filename']);
            $this->emitter->run('file.delete:after', [$file]);
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

        return [
            'type' => $fileData['type'],
            'name' => $fileData['name'],
            'title' => $fileData['title'],
            'tags' => $fileData['tags'],
            'description' => $fileData['caption'],
            'location' => $fileData['location'],
            'charset' => $fileData['charset'],
            'size' => $fileData['size'],
            'width' => $fileData['width'],
            'height' => $fileData['height'],
            //    @TODO: Returns date in ISO 8601 Ex: 2016-06-06T17:18:20Z
            //    see: https://en.wikipedia.org/wiki/ISO_8601
            'date_uploaded' => $fileData['date_uploaded'], // . ' UTC',
            'storage' => $fileData['storage']
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
        $app = Application::getInstance();
        $embedManager = $app->getContainer()->get('embed_manager');
        try {
            $info = $embedManager->parse($url);
        } catch (\Exception $e) {
            $info = $this->getImageFromURL($url);
        }

        if ($info) {
            $info['storage'] = $this->getConfig('adapter');
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

        $contentType = $urlHeaders['Content-Type'];
        if (is_array($contentType)) {
            $contentType = array_shift($contentType);
        }

        $contentType = $this->getMimeTypeFromContentType($contentType);

        if (strpos($contentType, 'image/') === false) {
            return $info;
        }

        $urlInfo = \Directus\parse_url_file($url);
        $content = file_get_contents($url);
        if (!$content) {
            return $info;
        }

        list($width, $height) = getimagesizefromstring($content);

        if (isset($urlInfo['filename']) && !empty($urlInfo['filename'])) {
            $filename = $urlInfo['filename'];
        } else {
            $filename = md5(time() . $url);
        }

        $data = base64_encode($content);
        $info['filename'] = filename_put_ext($filename, MimeTypeUtils::getFromMimeType($contentType));
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
     * @param bool $replace
     *
     * @return array
     */
    public function saveData($fileData, $fileName, $replace = false)
    {
        // When file is uploaded via multipart form data then We will get object of Slim\Http\UploadFile
        // When file is uploaded via URL (Youtube, Vimeo, or image link) then we will get base64 encode string.
        if (is_object($fileData)) {

            $checksum = hash_file('md5', $fileData->file);
        } else {
            $fileData = base64_decode($this->getDataInfo($fileData)['data']);
            $checksum = md5($fileData);
        }
        // @TODO: merge with upload()
        $fileName = $this->getFileName($fileName, $replace !== true);

        $filePath = $this->getConfig('root') . '/' . $fileName;



        $this->emitter->run('file.save', ['name' => $fileName, 'size' => strlen($fileData)]);
        $this->write($fileName, $fileData, $replace);
        $this->emitter->run('file.save:after', ['name' => $fileName, 'size' => strlen($fileData)]);

        unset($fileData);

        $fileData = $this->getFileInfo($fileName);
        $fileData['title'] = Formatting::fileNameToFileTitle($fileName);
        $fileData['filename'] = basename($filePath);
        $fileData['storage'] = $this->config['adapter'];

        $fileData = array_merge($this->defaults, $fileData);

        return [
            // The MIME type will be based on its extension, rather than its content
            'type' => MimeTypeUtils::getFromFilename($fileData['filename']),
            'filename' => $fileData['filename'],
            'title' => $fileData['title'],
            'tags' => $fileData['tags'],
            'description' => $fileData['description'],
            'location' => $fileData['location'],
            'charset' => $fileData['charset'],
            'filesize' => $fileData['size'],
            'width' => $fileData['width'],
            'height' => $fileData['height'],
            'storage' => $fileData['storage'],
            'checksum' => $checksum,
        ];
    }

    /**
     * Save embed url into Directus Media
     *
     * @param array $fileInfo - File Data/Info
     *
     * @return array - file info
     */
    public function saveEmbedData(array $fileInfo)
    {
        if (!array_key_exists('type', $fileInfo) || strpos($fileInfo['type'], 'embed/') !== 0) {
            return [];
        }

        $fileName = isset($fileInfo['filename']) ? $fileInfo['filename'] : md5(time()) . '.jpg';
        $thumbnailData = $this->saveData($fileInfo['data'], $fileName);

        return array_merge(
            $fileInfo,
            ArrayUtils::pick($thumbnailData, [
                'filename',
            ])
        );
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
            $fileData = $this->getFileInfoFromData($buffer);
        } else {
            $fileData = $this->getFileInfoFromPath($path);
        }

        return $fileData;
    }

    public function getFileInfoFromPath($path)
    {
        $mime = $this->filesystem->getAdapter()->getMimetype($path);

        $typeTokens = explode('/', $mime);

        if ($typeTokens[0] == 'image') {
            $buffer = $this->filesystem->getAdapter()->read($path);
            $info = $this->getFileInfoFromData($buffer);
        } else {
            $size = $this->filesystem->getAdapter()->getSize($path);
            $info = [
                'type' => $mime,
                'format' => $typeTokens[1],
                'size' => $size,
                'width' => null,
                'height' => null
            ];
        }

        return $info;
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
     * Writes the given data in the given location
     *
     * @param $location
     * @param $data
     * @param bool $replace
     *
     * @throws \RuntimeException
     */
    public function write($location, $data, $replace = false)
    {
        $this->filesystem->write($location, $data, $replace);
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

        $this->emitter->run('file.save', ['name' => $targetName, 'size' => strlen($data)]);
        $this->write($targetName, $data);
        $this->emitter->run('file.save:after', ['name' => $targetName, 'size' => strlen($data)]);

        $fileData['name'] = basename($finalPath);
        $fileData['date_uploaded'] = DateTimeUtils::nowInUTC()->toString();
        $fileData['storage'] = $this->config['adapter'];

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
        // Swap out Non "Letters" with a -
        $fileName = preg_replace('/[^\\pL\d^\.]+/u', '-', $fileName);

        // Trim out extra -'s
        $fileName = trim($fileName, '-');

        // Make text lowercase
        $fileName = strtolower($fileName);

        // Strip out anything we haven't been able to convert
        $fileName = preg_replace('/[^-\w\.]+/', '', $fileName);

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
    public function uniqueName($fileName, $targetPath = null, $attempt = 0)
    {
        if (!$targetPath) {
            $targetPath = $this->filesystem->getPath();
        }

        $ext = pathinfo($fileName, PATHINFO_EXTENSION);
        $name = pathinfo($fileName, PATHINFO_FILENAME);
        $newName = $this->sanitizeName(filename_put_ext($name, $ext));

        if ($this->filesystem->exists($newName)) {
            $matches = [];
            $format = '/\-(\d)%s$/';
            $withExtension = '';
            if ($ext) {
                $withExtension = '\.(' . $ext . ')';
            }

            $trailingDigit = sprintf($format, $withExtension);

            if (preg_match($trailingDigit, $fileName, $matches)) {
                // Convert "fname-1.jpg" to "fname-2.jpg"
                $attempt = 1 + (int)$matches[1];
                $newName = preg_replace(
                    $trailingDigit,
                    filename_put_ext("-{$attempt}", $ext),
                    $newName
                );
            } else {
                if ($attempt) {
                    $name = rtrim($name, $attempt);
                    $name = rtrim($name, '-');
                }

                $attempt++;
                $newName = filename_put_ext($name . '-' . $attempt, $ext);
            }

            return $this->uniqueName($newName, $targetPath, $attempt);
        }

        return $newName;
    }

    /**
     * Get file name based on file naming setting
     *
     * @param string $fileName
     * @param bool $unique
     *
     * @return string
     */
    private function getFileName($fileName, $unique = true)
    {
        switch ($this->getSettings('file_naming')) {
            case 'uuid':
                $fileName = $this->uuidFileName($fileName);
                break;
        }

        if ($unique) {
            $fileName = $this->uniqueName($fileName, $this->filesystem->getPath());
        }

        return $fileName;
    }

    /**
     * Hash file name
     *
     * @param string $fileName
     *
     * @return string
     */
    private function uuidFileName($fileName)
    {
        $ext = pathinfo($fileName, PATHINFO_EXTENSION);
        $fileHashName = generate_uuid5(null, $fileName);

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
}
