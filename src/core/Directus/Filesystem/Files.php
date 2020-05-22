<?php

namespace Directus\Filesystem;

use Directus\Application\Application;
use Slim\Http\UploadedFile;
use function Directus\filename_put_ext;
use function Directus\generate_uuid4;
use function Directus\is_a_url;
use Directus\Util\ArrayUtils;
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
        'location' => '',
        'charset' => ''
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
        if ($this->exists($file['filename_disk'])) {
            $this->emitter->run('file.delete', [$file]);
            $this->filesystem->getAdapter()->delete($file['filename_disk']);
            $this->emitter->run('file.delete:after', [$file]);
        }
    }

    public function deleteThumb($file)
    {
        $ignoreableFiles = ['.DS_Store', '..', '.'];
        $scannedDirectory = array_values(array_diff(scandir($this->filesystem->getPath()), $ignoreableFiles));

        foreach ($scannedDirectory as $directory) {
            $fileName = $directory . '/' . $file['filename_disk'];
            if ($this->exists($fileName)) {
                $this->filesystem->getAdapter()->delete($fileName);
            }
        }
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
     * Check strpos in array
     *
     * @param string $haystack - The string to search in.
     * @param array $needle - Array to search from string
     *
     * @return boolean
     */
    function strposarray($haystack, $needle)
    {
        if (!is_array($needle)) $needle = array($needle);
        foreach ($needle as $query) {
            if (strpos($haystack, $query) !== false) return true;
        }
        return false;
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
        $comparableContentType = ['image/', 'pdf'];
        if (!$this->strposarray($contentType, $comparableContentType)) {
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
     * @param string|UploadedFile $fileData - base64 data or directus_files object
     * @param string $fileName - name of the file
     * @param bool $replace
     *
     * @return array
     *
     * @todo Refactor this to be clearer what's going on. $fileData can be anything,
     *       all kinds of things are happening, and nothing is documented
     */
    public function saveData($fileData, $fileName, $replace = false)
    {
        // When file is uploaded via multipart form data then We will get object of Slim\Http\UploadFile
        // When file is uploaded via URL (Youtube, Vimeo, or image link) then we will get base64 encode string.
        $size = null;

        $title = $fileName;

        if (is_object($fileData)) {
            $size = $fileData->getSize();
            $checksum = hash_file('md5', $fileData->file);
        } else {
            $fileData = base64_decode($this->getDataInfo($fileData)['data']);
            $checksum = md5($fileData);
            $size = strlen($fileData);
        }

        $fileName = $this->getFileName($fileName, $replace !== true);
        $filePath = $this->getConfig('root') . '/' . $fileName;

        $event = $replace ? 'file.update' : 'file.save';
        $this->emitter->run($event, ['name' => $fileName, 'size' => $size]);

        // On name change, the file would be overwritten with the empty file data.
        // This prevents you can't update a file to a zero-byte file.
        if (!empty($fileData)) {
            // This is where the actual bytes of the file are actually written to storage,
            // which may be the local filesystem or remote.
            $this->write($fileName, $fileData, $replace);
        }

        $this->emitter->run($event . ':after', ['name' => $fileName, 'size' => $size]);

        #open local tmp file since s3 bucket is private
        // Changed to use the existing temporary uploaded file on disk. As far as I can tell,
        // this method is only ever called from FilesServices::create and ::update (via
        // FilesServices::getSaveData) and $fileData will only ever be an object with a
        // "file" property if it's an UploadedFile, so "file" is always already the path to
        // a temporary file on disk.
        $tmp = null;
        if (is_object($fileData) && isset($fileData->file)) {
            // Keep track of the local temporary uploaded file so we can extract extra
            // metadata from it later, if possible.
            $tmp = $fileData->file;
        }

        unset($fileData);

        $fileData = $this->getFileInfo($fileName, false, $tmp);
        $fileData['title'] = Formatting::fileNameToFileTitle($title);
        $fileData['filename_disk'] = basename($filePath);
        $fileData['storage'] = $this->config['adapter'];

        $fileData = array_merge($this->defaults, $fileData);

        # Updates for file meta data tags
        // Only try to extract extra metadata if we know we have a local copy on the filesystem.
        // @TODO This should probably be moved to the appropriate getFileInfo methods
        if (isset($tmp) && strpos($fileData['type'], 'video') !== false) {
            #use ffprobe on local file, can't stream data to it or reference
            $output = shell_exec("ffprobe {$tmp} -show_entries format=duration:stream=height,width -v quiet -of json");
            #echo($output);
            $media = json_decode($output);
            if($media && is_object($media)) {
                $width = $media->streams[0]->width;
                $height = $media->streams[0]->height;
                $duration = $media->format->duration;   #seconds
            }

        } elseif (isset($tmp) && strpos($fileData['type'], 'audio') !== false) {
            $output = shell_exec("ffprobe {$tmp} -show_entries format=duration -v quiet -of json");
            $media = json_decode($output);

            if($media && is_object($media)) {
                $duration = $media->format->duration;
            }
        }
        if (isset($handle)) {
            fclose($handle);
        }

        $response = [
            // The MIME type will be based on its extension, rather than its extension
            'type' => MimeTypeUtils::getFromFilename($fileData['filename_disk']),
            'filename_disk' => $fileData['filename_disk'],
            'tags' => $fileData['tags'],
            'description' => $fileData['description'],
            'location' => $fileData['location'],
            'charset' => $fileData['charset'],
            'filesize' => $fileData['size'],
            'width' => isset($width) ? $width : $fileData['width'],
            'height' => isset($height) ? $height : $fileData['height'],
            'metadata' => isset($file['metadata']) ? $file['metadata'] : null,
            'storage' => $fileData['storage'],
            'checksum' => $checksum,
            'duration' => isset($duration) ? $duration : 0
        ];

        if (!$replace) {
            $response['title'] = $fileData['title'];
        }

        return $response;
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

        $fileName = isset($fileInfo['filename_disk']) ? $fileInfo['filename_disk'] : md5(time()) . '.jpg';
        $thumbnailData = $this->saveData($fileInfo['data'], $fileName, $fileInfo['fileId']);

        return array_merge(
            $fileInfo,
            ArrayUtils::pick($thumbnailData, [
                'filename_disk',
            ])
        );
    }

    /**
     * Get file info
     *
     * @param string $path - file path
     * @param bool $outside - if the $path is outside of the adapter root path.
     * @param string|null $localCopy - path to local copy of the file, if available
     *
     * @throws \RuntimeException
     *
     * @return array file information
     */
    public function getFileInfo($path, $outside = false, $localCopy = null)
    {
        if (!is_null($localCopy)) {
            // If there is a local copy, we can collect all the metadata we need without
            // loading the data into memory.
            return $this->getFileInfoFromLocalCopy($path, $localCopy);
        }
        if ($outside === true) {
            $buffer = file_get_contents($path);
            $fileData = $this->getFileInfoFromData($buffer);
        } else {
            $fileData = $this->getFileInfoFromPath($path);
        }

        return $fileData;
    }

    /**
     * Collect metadata about a file for which there exists a local copy on disk
     *
     * @param string $path
     * @param string $localCopy
     * @return array
     */
    public function getFileInfoFromLocalCopy($path, $localCopy)
    {
        $mime = MimeTypeUtils::getFromFilename($path);

        $typeTokens = explode('/', $mime);

        $size = filesize($localCopy);
        $info = [
            'type' => $mime,
            'format' => $typeTokens[1],
            'size' => $size,
            'width' => null,
            'height' => null
        ];

        if ($typeTokens[0] == 'image') {
            $meta = [];
            $imageInfo = getimagesize($localCopy, $meta);
            $this->collectImageInfo($imageInfo, $meta, $info);
        }

        return $info;
    }

    /**
     * Collect metadata about a file in storage
     *
     * @param string $path
     * @return array
     * @throws \League\Flysystem\FileNotFoundException
     */
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

    /**
     * Extract metadata from file contents
     *
     * @param string $data
     * @return array
     */
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
            $this->collectImageInfo($imageInfo, $meta, $info);
        }

        return $info;
    }

    /**
     * Combine info from getimagesize[fromstring] with existing info array
     *
     * @param array|false $imageInfo As returned by getimagesize[fromstring]
     * @param array $meta As provided via the second argument to getimagesize[fromstring]
     * @param array $info Passed by reference
     */
    protected function collectImageInfo($imageInfo, $meta, &$info)
    {
        if (is_array($imageInfo)) {
            $info['width'] = $imageInfo[0];
            $info['height'] = $imageInfo[1];
        }

        if (is_array($meta) && isset($meta['APP13'])) {
            $iptc = iptcparse($meta['APP13']);

            if (isset($iptc['2#120'])) {
                $info['description'] = $iptc['2#120'][0];
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
     * Sanitize title name from file name
     *
     * @param string $fileName
     *
     * @return string
     */
    private function sanitizeName($fileName)
    {
        // Swap out Non "Letters" with a -
        $fileName = preg_replace('/[^_\\pL\d^\.]+/u', '-', $fileName);

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
                $attempt = 1 + (int) $matches[1];
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
        if ($unique) {
            switch ($this->getSettings('file_naming')) {
                case 'uuid':
                    $fileName = $this->uuidFileName($fileName);
                    break;
            }
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
        $fileHashName = generate_uuid4();

        return $fileHashName . '.' . $ext;
    }

    /**
     * Get a file size and type info from base64 data , URL ,multipart form data
     *
     * @param string|UploadedFile $data
     *
     * @return array file size and type
     */
    public function getFileSizeType($data)
    {
        $result = [];
        if (is_a_url($data)) {
            $dataInfo = $this->getLink($data);
            $result['mimeType'] = isset($dataInfo['type']) ? $dataInfo['type'] : null;
            $result['size'] = isset($dataInfo['filesize']) ? $dataInfo['filesize'] : (isset($dataInfo['size']) ? $dataInfo['size'] : null);
        } else if (is_object($data)) {
            $result['mimeType'] = $data->getClientMediaType();
            $result['size'] = $data->getSize();
        } else if (strpos($data, 'data:') === 0) {
            $parts = explode(',', $data);
            $file = $parts[1];
            $dataInfo = $this->getFileInfoFromData(base64_decode($file));
            $result['mimeType'] = isset($dataInfo['type']) ? $dataInfo['type'] : null;
            $result['size'] = isset($dataInfo['size']) ? $dataInfo['size'] : null;
        }
        return $result;
    }
}
