<?php

namespace League\Flysystem;

use League\Flysystem\Util\MimeType;
use LogicException;

class Util
{
    /**
     * Get normalized pathinfo.
     *
     * @param string $path
     *
     * @return array pathinfo
     */
    public static function pathinfo($path)
    {
        $pathinfo = pathinfo($path) + compact('path');
        $pathinfo['dirname'] = array_key_exists('dirname', $pathinfo)
            ? static::normalizeDirname($pathinfo['dirname']) : '';

        return $pathinfo;
    }

    /**
     * Normalize a dirname return value.
     *
     * @param string $dirname
     *
     * @return string normalized dirname
     */
    public static function normalizeDirname($dirname)
    {
        return $dirname === '.' ? '' : $dirname;
    }

    /**
     * Get a normalized dirname from a path.
     *
     * @param string $path
     *
     * @return string dirname
     */
    public static function dirname($path)
    {
        return static::normalizeDirname(dirname($path));
    }

    /**
     * Map result arrays.
     *
     * @param array $object
     * @param array $map
     *
     * @return array mapped result
     */
    public static function map(array $object, array $map)
    {
        $result = [];

        foreach ($map as $from => $to) {
            if ( ! isset($object[$from])) {
                continue;
            }

            $result[$to] = $object[$from];
        }

        return $result;
    }

    /**
     * Normalize path.
     *
     * @param string $path
     *
     * @throws LogicException
     *
     * @return string
     */
    public static function normalizePath($path)
    {
        // Remove any kind of funky unicode whitespace
        $normalized = preg_replace('#\p{C}+|^\./#u', '', $path);
        $normalized = static::normalizeRelativePath($normalized);

        if (preg_match('#(^|/)\.{2}(/|$)#', $normalized)) {
            throw new LogicException(
                'Path is outside of the defined root, path: [' . $path . '], resolved: [' . $normalized . ']'
            );
        }

        $normalized = preg_replace('#\\\{2,}#', '\\', trim($normalized, '\\'));
        $normalized = preg_replace('#/{2,}#', '/', trim($normalized, '/'));

        return $normalized;
    }

    /**
     * Normalize relative directories in a path.
     *
     * @param string $path
     *
     * @return string
     */
    public static function normalizeRelativePath($path)
    {
        // Path remove self referring paths ("/./").
        $path = preg_replace('#/\.(?=/)|^\./|(/|^)\./?$#', '', $path);

        // Regex for resolving relative paths
        $regex = '#/*[^/\.]+/\.\.(?=/|$)#Uu';

        while (preg_match($regex, $path)) {
            $path = preg_replace($regex, '', $path);
        }

        return $path;
    }

    /**
     * Normalize prefix.
     *
     * @param string $prefix
     * @param string $separator
     *
     * @return string normalized path
     */
    public static function normalizePrefix($prefix, $separator)
    {
        return rtrim($prefix, $separator) . $separator;
    }

    /**
     * Get content size.
     *
     * @param string $contents
     *
     * @return int content size
     */
    public static function contentSize($contents)
    {
        return defined('MB_OVERLOAD_STRING') ? mb_strlen($contents, '8bit') : strlen($contents);
    }

    /**
     * Guess MIME Type based on the path of the file and it's content.
     *
     * @param string $path
     * @param string|resource $content
     *
     * @return string|null MIME Type or NULL if no extension detected
     */
    public static function guessMimeType($path, $content)
    {
        $mimeType = MimeType::detectByContent($content);

        if ( ! (empty($mimeType) || in_array($mimeType, ['application/x-empty', 'text/plain', 'text/x-asm']))) {
            return $mimeType;
        }

        return MimeType::detectByFilename($path);
    }

    /**
     * Emulate directories.
     *
     * @param array $listing
     *
     * @return array listing with emulated directories
     */
    public static function emulateDirectories(array $listing)
    {
        $directories = [];
        $listedDirectories = [];

        foreach ($listing as $object) {
            list($directories, $listedDirectories) = static::emulateObjectDirectories(
                $object,
                $directories,
                $listedDirectories
            );
        }

        $directories = array_diff(array_unique($directories), array_unique($listedDirectories));

        foreach ($directories as $directory) {
            $listing[] = static::pathinfo($directory) + ['type' => 'dir'];
        }

        return $listing;
    }

    /**
     * Ensure a Config instance.
     *
     * @param null|array|Config $config
     *
     * @return Config config instance
     *
     * @throw  LogicException
     */
    public static function ensureConfig($config)
    {
        if ($config === null) {
            return new Config();
        }

        if ($config instanceof Config) {
            return $config;
        }

        if (is_array($config)) {
            return new Config($config);
        }

        throw new LogicException('A config should either be an array or a Flysystem\Config object.');
    }

    /**
     * Rewind a stream.
     *
     * @param resource $resource
     */
    public static function rewindStream($resource)
    {
        if (ftell($resource) !== 0 && static::isSeekableStream($resource)) {
            rewind($resource);
        }
    }

    public static function isSeekableStream($resource)
    {
        $metadata = stream_get_meta_data($resource);

        return $metadata['seekable'];
    }

    /**
     * Get the size of a stream.
     *
     * @param resource $resource
     *
     * @return int stream size
     */
    public static function getStreamSize($resource)
    {
        $stat = fstat($resource);

        return $stat['size'];
    }

    /**
     * Emulate the directories of a single object.
     *
     * @param array $object
     * @param array $directories
     * @param array $listedDirectories
     *
     * @return array
     */
    protected static function emulateObjectDirectories(array $object, array $directories, array $listedDirectories)
    {
        if ($object['type'] === 'dir') {
            $listedDirectories[] = $object['path'];
        }

        if (empty($object['dirname'])) {
            return [$directories, $listedDirectories];
        }

        $parent = $object['dirname'];

        while ( ! empty($parent) && ! in_array($parent, $directories)) {
            $directories[] = $parent;
            $parent = static::dirname($parent);
        }

        if (isset($object['type']) && $object['type'] === 'dir') {
            $listedDirectories[] = $object['path'];

            return [$directories, $listedDirectories];
        }

        return [$directories, $listedDirectories];
    }
}
