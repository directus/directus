<?php

namespace Directus;

use Directus\Application\Application;
use Directus\Filesystem\Thumbnail;
use function Directus\get_directus_setting;
use Directus\Validator\Exception\InvalidRequestException;
use Directus\Util\MimeTypeUtils;

if (!function_exists('is_uploaded_file_okay')) {
    /**
     * Checks whether upload file has not error.
     *
     * @param $error
     *
     * @return bool
     */
    function is_uploaded_file_okay($error)
    {
        return $error === UPLOAD_ERR_OK;
    }
}

if (!function_exists('get_uploaded_file_error')) {
    /**
     * Returns the upload file error message
     *
     * Returns null if there's not error
     *
     * @param $error
     *
     * @return string|null
     */
    function get_uploaded_file_error($error)
    {
        switch ($error) {
            case UPLOAD_ERR_INI_SIZE:
                $message = 'The uploaded file exceeds max upload size that was specified on the server.';
                break;
            case UPLOAD_ERR_FORM_SIZE:
                $message = 'The uploaded file exceeds the max upload size that was specified in the client.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $message = 'The uploaded file was only partially uploaded.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $message = 'No file was uploaded.';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $message = 'Missing temporary upload folder';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $message = 'Failed to write file to disk.';
                break;
            case UPLOAD_ERR_EXTENSION:
                $message = 'A PHP extension stopped the file upload';
                break;
            case UPLOAD_ERR_OK:
                $message = null;
                break;
            default:
                $message = 'Unknown error uploading a file.';
        }

        return $message;
    }
}

if (!function_exists('get_uploaded_file_status')) {
    /**
     * Returns the upload file http status code
     *
     * @param $error
     *
     * @return int|null
     */
    function get_uploaded_file_status($error)
    {
        switch ($error) {
            case UPLOAD_ERR_INI_SIZE:
                $code = 413;
                break;
            case UPLOAD_ERR_FORM_SIZE:
            case UPLOAD_ERR_PARTIAL:
            case UPLOAD_ERR_NO_FILE:
            case UPLOAD_ERR_NO_TMP_DIR:
            case UPLOAD_ERR_CANT_WRITE:
            case UPLOAD_ERR_EXTENSION:
            default:
                $code = null;
                break;
            case UPLOAD_ERR_OK:
                $code = 200;
                break;
        }

        return $code;
    }
}

if (!function_exists('append_storage_information')) {
    /**
     * append storage information to one or multiple file items
     *
     * @param array $rows
     *
     * @return array
     */
    function append_storage_information(array $rows)
    {

        if (empty($rows)) {
            return $rows;
        }

        $container = Application::getInstance()->getContainer();

        $config = $container->get('config');
        $proxyDownloads = $config->get('storage.proxy_downloads');
        $fileRootUrl = $config->get('storage.root_url');
        $hasFileRootUrlHost = parse_url($fileRootUrl, PHP_URL_HOST);

        $list = isset($rows[0]);

        if (!$list) {
            $rows = [$rows];
        }

        $assetURLNaming = get_directus_setting('asset_url_naming');
        $projectName = get_api_project_from_request();
        $basepath = get_base_path();

        foreach ($rows as &$row) {
            $data = [];
            $ext = pathinfo($row['filename_disk'], PATHINFO_EXTENSION);

            $fileAlias = $assetURLNaming == "private_hash" ? $row['private_hash'] : $row['filename_download'];

            if ($proxyDownloads) {
                $data['url'] = get_proxy_path($row['filename_disk']);
                $data['full_url'] = get_url($data['url']);
            } else {
                if (isset($row['private_hash'])) {
                    $data['url'] = $data['full_url'] = $fileRootUrl . '/' . $row['filename_disk'];
                    $data['asset_url'] = $basepath . $projectName . '/assets/' . $fileAlias;

                    // Add Full url
                    if (!$hasFileRootUrlHost) {
                        $data['full_url'] = get_url($data['url']);
                    }
                }
            }

            // Add thumbnails if the asset is an image
            $search = 'image';
            if (
                array_key_exists('type', $row) &&
                substr($row['type'], 0, strlen($search)) === $search &&
                $row['type'] !== 'image/svg+xml' // SVGs aren't manipulatable bitmaps
            ) {
                $data['thumbnails'] = get_thumbnails($row);
            } else {
                $data['thumbnails'] = null;
            }

            // Add embed content
            /** @var \Directus\Embed\EmbedManager $embedManager */
            $embedManager = $container->get('embed_manager');
            $provider = isset($row['type']) ? $embedManager->getByType($row['type']) : null;
            $embed = null;
            if ($provider) {
                $embed = [
                    'html' => $provider->getCode($row),
                    'url' => $provider->getUrl($row),
                ];
            }

            $data['embed'] = $embed;

            $row['data'] = $data;
        }

        return $list ? $rows : reset($rows);
    }
}

if (!function_exists('add_default_dimensions')) {
    /**
     * Adds the default dimensions to the dimension list
     *
     * @param array $list
     */
    function add_default_thumbnail_dimensions(array &$list)
    {
        $defaultDimension = '200x200';
        if (!in_array($defaultDimension, $list)) {
            array_unshift($list, $defaultDimension);
        }
    }
}

if (!function_exists('get_thumbnails')) {
    /**
     * Returns the row thumbnails data
     *
     * @param array $row
     *
     * @return array|null
     */
    function get_thumbnails(array $row)
    {

        $thumbnailURLPattern =  get_directus_setting('asset_url_naming');
        $urlAlias = $thumbnailURLPattern == "private_hash" ? $row['private_hash'] : $row['filename_download'];

        $filename = $row['filename_disk'];
        $type = array_get($row, 'type');
        $thumbnailFilenameParts = explode('.', $filename);
        $thumbnailExtension = array_pop($thumbnailFilenameParts);

        $systemThumb = json_decode(get_directus_setting('asset_whitelist_system'), true);
        $whitelistThumb = json_decode(get_directus_setting('asset_whitelist'), true);
        $thumbnailWhitelist = !empty($whitelistThumb) ? array_merge($systemThumb, $whitelistThumb) : $systemThumb;

        $fileExtension = MimeTypeUtils::getFromMimeType($type);

        if (!in_array($fileExtension, Thumbnail::getFormatsSupported())  &&  strpos($type, 'embed/') !== 0) {
            return null;
        }

        $thumbnails = [];
        foreach ($thumbnailWhitelist as $thumbnail) {
            if (Thumbnail::isNonImageFormatSupported($thumbnailExtension)) {
                $thumbnailExtension = Thumbnail::defaultFormat();
            }

            $thumbnailUrl = get_thumbnail_url($urlAlias, $thumbnail);
            $thumbnailRelativeUrl = get_thumbnail_path($urlAlias, $thumbnail, true);
            $thumbnails[] = [
                'key' => $thumbnail['key'],
                'url' => $thumbnailUrl,
                'relative_url' => $thumbnailRelativeUrl,
                'dimension' => $thumbnail['width'] . 'x' . $thumbnail['height'],
                'width' => (int) $thumbnail['width'],
                'height' => (int) $thumbnail['height'],
            ];
        }

        return $thumbnails;
    }
}

if (!function_exists('get_thumbnail_url')) {
    /**
     * Returns a url for the given file pointing to the thumbnailer
     *
     * @param array $thumbnail
     *
     * @return string
     */
    function get_thumbnail_url($name, $thumbnail)
    {
        return get_url(get_thumbnail_path($name, $thumbnail));
    }
}

if (!function_exists('get_thumbnail_path')) {
    /**
     * Returns a relative url for the given file pointing to the thumbnailer
     *
     * @param array $thumbnail
     *
     * @return string
     */
    function get_thumbnail_path($name, $thumbnail, $addBasePath = false)
    {
        $path = '';

        $projectName = get_api_project_from_request();
        $paramsString = '?key=' . $thumbnail['key'];

        $path = $projectName . '/assets/' . $name . $paramsString;

        if ($addBasePath === true) {
            $basePath = get_base_path();
            $path = $basePath . $path;
        }

        return $path;
    }
}

if (!function_exists('get_proxy_path')) {
    /**
     * Returns a relative url for the given file pointing to the proxy
     *
     * @param string $path
     *
     * @return string
     */
    function get_proxy_path($path)
    {
        $projectName = get_api_project_from_request();

        // env/width/height/mode/quality/name
        return sprintf(
            '/downloads/%s/%s',
            $projectName,
            $path
        );
    }
}

if (!function_exists('filename_put_ext')) {
    /**
     * Appends an extension to a filename
     *
     * @param string $name
     * @param string|null $ext
     *
     * @return string
     */
    function filename_put_ext($name, $ext = null)
    {
        if ($ext) {
            $name = sprintf('%s.%s', $name, $ext);
        }

        return $name;
    }
}

if (!function_exists('is_a_url')) {
    /**
     * Checks whether or not the given value is a URL
     *
     * @param string $value
     *
     * @return bool
     */
    function is_a_url($value)
    {
        if (!is_string($value)) {
            return false;
        }

        if (preg_match('#^data:.+\/.+;base64,#si', $value)) {
            return false;
        }

        // Ported from: https://github.com/segmentio/is-url/blob/master/index.js
        if (!preg_match('#^(?:\w+:)?\/\/(.+)$#si', $value, $matches)) {
            return false;
        }

        $hostAndPath = $matches[1];
        if (!$hostAndPath) {
            return false;
        }

        if (preg_match('#^[^\s\.]+\.\S{2,}$#si', $hostAndPath)) {
            return true;
        }

        return false;
    }
}

if (!function_exists('validate_file')) {
    /**
     * Validate A File
     *
     * @param string $value
     *
     * @return bool
     */
    function validate_file($value, $constraint, $options = null)
    {
        switch ($constraint) {
            case 'mimeTypes':
                validate_file_mime_type($value, $options);
                break;
            case 'maxSize':
                validate_file_size($value, $options);
                break;
        }
    }
}

if (!function_exists('validate_file_mime_type')) {
    /**
     * Validate A File Mime Types
     *
     * @param string $value
     *
     * @return bool
     */
    function validate_file_mime_type($value, $options)
    {
        $mimeTypes = $options;
        $mime = $value;

        if ($options == null) {
            $options = get_directus_setting('file_mimetype_whitelist');
            $mimeTypes = explode(",", $options);
        }
        foreach ($mimeTypes as $mimeType) {
            if ($mimeType === $mime) {
                return;
            }
            if ($type = strstr($mimeType, '/*', true)) {
                if (strstr($mime, '/', true) === $type) {
                    return;
                }
            }
        }
        $message = 'The mime type of the file is invalid.Allowed mime types are ' . $options . '.';
        throw new InvalidRequestException($message);
    }
}
if (!function_exists('validate_file_size')) {
    /**
     * Validate A File Size
     *
     * @param string $value
     *
     * @return bool
     */
    function validate_file_size($value, $options)
    {
        $maxSize = $options;
        if ($options == null) {
            $maxSize = \Directus\get_max_upload_size();
        }
        $size = $maxSize;
        $factors = [
            'KB' => 1000,
            'MB' => 1000000,
            'GB' => 1000000000,
            'TB' => 1000000000000
        ];
        if (ctype_digit((string) $maxSize)) {
            $maxSize = (int) $maxSize;
        } elseif (preg_match('/^(\d++)(' . implode('|', array_keys($factors)) . ')$/', $maxSize, $matches)) {
            $maxSize = $matches[1] * $factors[$unit = $matches[2]];
        } else {
            throw new InvalidRequestException(sprintf('"%s" is not a valid maximum size.', $size));
        }

        if (0 === $value) {
            $message = 'An empty file is not allowed.';
            throw new InvalidRequestException($message);
        }

        if ($value > $maxSize && $maxSize != 0) {
            $message = 'The file is too large. Allowed maximum size is ' . $size . '.';
            throw new InvalidRequestException($message);
        }
    }
}

if (!function_exists('get_file_root_url')) {
    /**
     * Get File Root URL
     *
     *
     * @return string
     */
    function get_file_root_url()
    {
        $container = Application::getInstance()->getContainer();
        $config = $container->get('config');
        return $config->get('storage.root_url');
    }
}

if (!function_exists('get_random_string')) {
    function get_random_string($limit = 16)
    {
        return substr(base_convert(sha1(uniqid(mt_rand())), 16, 36), 0, $limit);
    }
}
