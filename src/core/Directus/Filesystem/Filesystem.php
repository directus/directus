<?php

namespace Directus\Filesystem;

use Directus\Filesystem\Exception\ForbiddenException;
use League\Flysystem\FilesystemInterface as FlysystemInterface;
use Slim\Http\UploadedFile;

class Filesystem
{
    /**
     * @var FlysystemInterface
     */
    private $adapter;

    public function __construct(FlysystemInterface $adapter)
    {
        $this->adapter = $adapter;
    }

    /**
     * Check whether a file exists.
     *
     * @param string $path
     *
     * @return bool
     */
    public function exists($path)
    {
        return $this->adapter->has($path);
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
        return $this->adapter->read($location);
    }

    /**
     * Returns a readable stream for the given location
     *
     * @param string $location
     * @return false|resource
     * @throws \League\Flysystem\FileNotFoundException
     */
    public function readStream($location)
    {
        return $this->adapter->readStream($location);
    }

    /**
     * Writes data to the given location
     *
     * @param string $location
     * @param string|UploadedFile $data
     * @param bool $replace
     */
    public function write($location, $data, $replace = false)
    {
        $throwException = function () use ($location) {
            throw new ForbiddenException(sprintf('No permission to write: %s', $location));
        };

        if ($replace === true && $this->exists($location)) {
            $this->getAdapter()->delete($location);
        }

        try {
            if (is_object($data)) { // Uploaded file is in resource format. Used when file uploaded in multipart form data.
                $handle = fopen($data->file, 'rb');
                if (!$this->getAdapter()->writeStream($location, $handle)) {
                    $throwException();
                }
                if (is_resource($handle)) {
                    fclose($handle);
                }
            } else { // Uploaded file is base64 format. Used when file uploaded as base64.
                if (!$this->getAdapter()->write($location, $data)) {
                    $throwException();
                }
            }
        } catch (\Exception $e) {
            $throwException();
        }
    }

    /**
     * Get the filesystem adapter (flysystem object)
     *
     * @return FlysystemInterface
     */
    public function getAdapter()
    {
        return $this->adapter;
    }

    /**
     * Get Filesystem adapter path
     *
     * @param string $path
     * @return string
     */
    public function getPath($path = '')
    {
        /** @var \League\Flysystem\AdapterInterface $adapter */
        $adapter = $this->adapter->getAdapter();

        if ($path) {
            return $adapter->applyPathPrefix($path);
        }

        return $adapter->getPathPrefix();
    }
}
