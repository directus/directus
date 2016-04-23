<?php

namespace League\Flysystem\Adapter;

use DirectoryIterator;
use FilesystemIterator;
use finfo as Finfo;
use League\Flysystem\AdapterInterface;
use League\Flysystem\Config;
use League\Flysystem\NotSupportedException;
use League\Flysystem\UnreadableFileException;
use League\Flysystem\Util;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class Local extends AbstractAdapter
{
    /**
     * @var int
     */
    const SKIP_LINKS = 0001;

    /**
     * @var int
     */
    const DISALLOW_LINKS = 0002;

    /**
     * @var array
     */
    protected static $permissions = [
        'file' => [
            'public' => 0744,
            'private' => 0700,
        ],
        'dir' => [
            'public' => 0755,
            'private' => 0700,
        ]
    ];

    /**
     * @var string
     */
    protected $pathSeparator = DIRECTORY_SEPARATOR;

    /**
     * @var array
     */
    protected $permissionMap;

    /**
     * @var int
     */
    protected $writeFlags;
    /**
     * @var int
     */
    private $linkHandling;

    /**
     * Constructor.
     *
     * @param string $root
     * @param int    $writeFlags
     * @param int    $linkHandling
     * @param array  $permissions
     */
    public function __construct($root, $writeFlags = LOCK_EX, $linkHandling = self::DISALLOW_LINKS, array $permissions = [])
    {
        // permissionMap needs to be set before ensureDirectory() is called.
        $this->permissionMap = array_replace_recursive(static::$permissions, $permissions);
        $realRoot = $this->ensureDirectory($root);

        if ( ! is_dir($realRoot) || ! is_readable($realRoot)) {
            throw new \LogicException('The root path ' . $root . ' is not readable.');
        }

        $this->setPathPrefix($realRoot);
        $this->writeFlags = $writeFlags;
        $this->linkHandling = $linkHandling;
    }

    /**
     * Ensure the root directory exists.
     *
     * @param string $root root directory path
     *
     * @return string real path to root
     */
    protected function ensureDirectory($root)
    {
        if ( ! is_dir($root)) {
            $umask = umask(0);
            mkdir($root, $this->permissionMap['dir']['public'], true);
            umask($umask);
        }

        return realpath($root);
    }

    /**
     * @inheritdoc
     */
    public function has($path)
    {
        $location = $this->applyPathPrefix($path);

        return file_exists($location);
    }

    /**
     * @inheritdoc
     */
    public function write($path, $contents, Config $config)
    {
        $location = $this->applyPathPrefix($path);
        $this->ensureDirectory(dirname($location));

        if (($size = file_put_contents($location, $contents, $this->writeFlags)) === false) {
            return false;
        }

        $type = 'file';
        $result = compact('contents', 'type', 'size', 'path');

        if ($visibility = $config->get('visibility')) {
            $result['visibility'] = $visibility;
            $this->setVisibility($path, $visibility);
        }

        return $result;
    }

    /**
     * @inheritdoc
     */
    public function writeStream($path, $resource, Config $config)
    {
        $location = $this->applyPathPrefix($path);
        $this->ensureDirectory(dirname($location));
        $stream = fopen($location, 'w+');

        if ( ! $stream) {
            return false;
        }

        stream_copy_to_stream($resource, $stream);

        if ( ! fclose($stream)) {
            return false;
        }

        if ($visibility = $config->get('visibility')) {
            $this->setVisibility($path, $visibility);
        }

        return compact('path', 'visibility');
    }

    /**
     * @inheritdoc
     */
    public function readStream($path)
    {
        $location = $this->applyPathPrefix($path);
        $stream = fopen($location, 'r');

        return compact('stream', 'path');
    }

    /**
     * @inheritdoc
     */
    public function updateStream($path, $resource, Config $config)
    {
        return $this->writeStream($path, $resource, $config);
    }

    /**
     * @inheritdoc
     */
    public function update($path, $contents, Config $config)
    {
        $location = $this->applyPathPrefix($path);
        $mimetype = Util::guessMimeType($path, $contents);
        $size = file_put_contents($location, $contents, $this->writeFlags);

        if ($size === false) {
            return false;
        }

        return compact('path', 'size', 'contents', 'mimetype');
    }

    /**
     * @inheritdoc
     */
    public function read($path)
    {
        $location = $this->applyPathPrefix($path);
        $contents = file_get_contents($location);

        if ($contents === false) {
            return false;
        }

        return compact('contents', 'path');
    }

    /**
     * @inheritdoc
     */
    public function rename($path, $newpath)
    {
        $location = $this->applyPathPrefix($path);
        $destination = $this->applyPathPrefix($newpath);
        $parentDirectory = $this->applyPathPrefix(Util::dirname($newpath));
        $this->ensureDirectory($parentDirectory);

        return rename($location, $destination);
    }

    /**
     * @inheritdoc
     */
    public function copy($path, $newpath)
    {
        $location = $this->applyPathPrefix($path);
        $destination = $this->applyPathPrefix($newpath);
        $this->ensureDirectory(dirname($destination));

        return copy($location, $destination);
    }

    /**
     * @inheritdoc
     */
    public function delete($path)
    {
        $location = $this->applyPathPrefix($path);

        return unlink($location);
    }

    /**
     * @inheritdoc
     */
    public function listContents($directory = '', $recursive = false)
    {
        $result = [];
        $location = $this->applyPathPrefix($directory) . $this->pathSeparator;

        if ( ! is_dir($location)) {
            return [];
        }

        $iterator = $recursive ? $this->getRecursiveDirectoryIterator($location) : $this->getDirectoryIterator($location);

        foreach ($iterator as $file) {
            $path = $this->getFilePath($file);

            if (preg_match('#(^|/|\\\\)\.{1,2}$#', $path)) {
                continue;
            }

            $result[] = $this->normalizeFileInfo($file);
        }

        return array_filter($result);
    }

    /**
     * @inheritdoc
     */
    public function getMetadata($path)
    {
        $location = $this->applyPathPrefix($path);
        $info = new SplFileInfo($location);

        return $this->normalizeFileInfo($info);
    }

    /**
     * @inheritdoc
     */
    public function getSize($path)
    {
        return $this->getMetadata($path);
    }

    /**
     * @inheritdoc
     */
    public function getMimetype($path)
    {
        $location = $this->applyPathPrefix($path);
        $finfo = new Finfo(FILEINFO_MIME_TYPE);

        return ['mimetype' => $finfo->file($location)];
    }

    /**
     * @inheritdoc
     */
    public function getTimestamp($path)
    {
        return $this->getMetadata($path);
    }

    /**
     * @inheritdoc
     */
    public function getVisibility($path)
    {
        $location = $this->applyPathPrefix($path);
        clearstatcache(false, $location);
        $permissions = octdec(substr(sprintf('%o', fileperms($location)), -4));
        $visibility = $permissions & 0044 ? AdapterInterface::VISIBILITY_PUBLIC : AdapterInterface::VISIBILITY_PRIVATE;

        return compact('visibility');
    }

    /**
     * @inheritdoc
     */
    public function setVisibility($path, $visibility)
    {
        $location = $this->applyPathPrefix($path);
        $type = is_dir($location) ? 'dir' : 'file';
        $success = chmod($location, $this->permissionMap[$type][$visibility]);

        if ($success === false) {
            return false;
        }

        return compact('visibility');
    }

    /**
     * @inheritdoc
     */
    public function createDir($dirname, Config $config)
    {
        $location = $this->applyPathPrefix($dirname);
        $umask = umask(0);
        $visibility = $config->get('visibility', 'public');

        if ( ! is_dir($location) && ! mkdir($location, $this->permissionMap['dir'][$visibility], true)) {
            $return = false;
        } else {
            $return = ['path' => $dirname, 'type' => 'dir'];
        }

        umask($umask);

        return $return;
    }

    /**
     * @inheritdoc
     */
    public function deleteDir($dirname)
    {
        $location = $this->applyPathPrefix($dirname);

        if ( ! is_dir($location)) {
            return false;
        }

        $contents = $this->getRecursiveDirectoryIterator($location, RecursiveIteratorIterator::CHILD_FIRST);

        /** @var SplFileInfo $file */
        foreach ($contents as $file) {
            $this->guardAgainstUnreadableFileInfo($file);
            $this->deleteFileInfoObject($file);
        }

        return rmdir($location);
    }

    /**
     * @param SplFileInfo $file
     */
    protected function deleteFileInfoObject(SplFileInfo $file)
    {
        switch ($file->getType()) {
            case 'dir':
                rmdir($file->getRealPath());
                break;
            case 'link':
                unlink($file->getPathname());
                break;
            default:
                unlink($file->getRealPath());
        }
    }

    /**
     * Normalize the file info.
     *
     * @param SplFileInfo $file
     *
     * @return array
     */
    protected function normalizeFileInfo(SplFileInfo $file)
    {
        if ( ! $file->isLink()) {
            return $this->mapFileInfo($file);
        }

        if ($this->linkHandling & self::DISALLOW_LINKS) {
            throw NotSupportedException::forLink($file);
        }
    }

    /**
     * Get the normalized path from a SplFileInfo object.
     *
     * @param SplFileInfo $file
     *
     * @return string
     */
    protected function getFilePath(SplFileInfo $file)
    {
        $location = $file->getPathname();
        $path = $this->removePathPrefix($location);

        return trim(str_replace('\\', '/', $path), '/');
    }

    /**
     * @param string $path
     * @param int    $mode
     *
     * @return RecursiveIteratorIterator
     */
    protected function getRecursiveDirectoryIterator($path, $mode = RecursiveIteratorIterator::SELF_FIRST)
    {
        return new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
            $mode
        );
    }

    /**
     * @param string $path
     *
     * @return DirectoryIterator
     */
    protected function getDirectoryIterator($path)
    {
        $iterator = new DirectoryIterator($path);

        return $iterator;
    }

    /**
     * @param SplFileInfo $file
     *
     * @return array
     */
    protected function mapFileInfo(SplFileInfo $file)
    {
        $normalized = [
            'type' => $file->getType(),
            'path' => $this->getFilePath($file),
        ];

        $normalized['timestamp'] = $file->getMTime();

        if ($normalized['type'] === 'file') {
            $normalized['size'] = $file->getSize();
        }

        return $normalized;
    }

    /**
     * @inheritdoc
     */
    public function applyPathPrefix($path)
    {
        $prefixedPath = parent::applyPathPrefix($path);

        return str_replace('/', DIRECTORY_SEPARATOR, $prefixedPath);
    }

    /**
     * @param SplFileInfo $file
     *
     * @throws UnreadableFileException
     */
    protected function guardAgainstUnreadableFileInfo(SplFileInfo $file)
    {
        if ( ! $file->isReadable()) {
            throw UnreadableFileException::forFileInfo($file);
        }
    }
}
