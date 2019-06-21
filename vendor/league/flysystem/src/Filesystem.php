<?php

namespace League\Flysystem;

use InvalidArgumentException;
use League\Flysystem\Adapter\CanOverwriteFiles;
use League\Flysystem\Plugin\PluggableTrait;
use League\Flysystem\Util\ContentListingFormatter;

/**
 * @method array getWithMetadata(string $path, array $metadata)
 * @method bool  forceCopy(string $path, string $newpath)
 * @method bool  forceRename(string $path, string $newpath)
 * @method array listFiles(string $path = '', boolean $recursive = false)
 * @method array listPaths(string $path = '', boolean $recursive = false)
 * @method array listWith(array $keys = [], $directory = '', $recursive = false)
 */
class Filesystem implements FilesystemInterface
{
    use PluggableTrait;
    use ConfigAwareTrait;

    /**
     * @var AdapterInterface
     */
    protected $adapter;

    /**
     * Constructor.
     *
     * @param AdapterInterface $adapter
     * @param Config|array     $config
     */
    public function __construct(AdapterInterface $adapter, $config = null)
    {
        $this->adapter = $adapter;
        $this->setConfig($config);
    }

    /**
     * Get the Adapter.
     *
     * @return AdapterInterface adapter
     */
    public function getAdapter()
    {
        return $this->adapter;
    }

    /**
     * @inheritdoc
     */
    public function has($path)
    {
        $path = Util::normalizePath($path);

        return strlen($path) === 0 ? false : (bool) $this->getAdapter()->has($path);
    }

    /**
     * @inheritdoc
     */
    public function write($path, $contents, array $config = [])
    {
        $path = Util::normalizePath($path);
        $this->assertAbsent($path);
        $config = $this->prepareConfig($config);

        return (bool) $this->getAdapter()->write($path, $contents, $config);
    }

    /**
     * @inheritdoc
     */
    public function writeStream($path, $resource, array $config = [])
    {
        if ( ! is_resource($resource)) {
            throw new InvalidArgumentException(__METHOD__ . ' expects argument #2 to be a valid resource.');
        }

        $path = Util::normalizePath($path);
        $this->assertAbsent($path);
        $config = $this->prepareConfig($config);

        Util::rewindStream($resource);

        return (bool) $this->getAdapter()->writeStream($path, $resource, $config);
    }

    /**
     * @inheritdoc
     */
    public function put($path, $contents, array $config = [])
    {
        $path = Util::normalizePath($path);
        $config = $this->prepareConfig($config);

        if ( ! $this->getAdapter() instanceof CanOverwriteFiles && $this->has($path)) {
            return (bool) $this->getAdapter()->update($path, $contents, $config);
        }

        return (bool) $this->getAdapter()->write($path, $contents, $config);
    }

    /**
     * @inheritdoc
     */
    public function putStream($path, $resource, array $config = [])
    {
        if ( ! is_resource($resource)) {
            throw new InvalidArgumentException(__METHOD__ . ' expects argument #2 to be a valid resource.');
        }

        $path = Util::normalizePath($path);
        $config = $this->prepareConfig($config);
        Util::rewindStream($resource);

        if ( ! $this->getAdapter() instanceof CanOverwriteFiles && $this->has($path)) {
            return (bool) $this->getAdapter()->updateStream($path, $resource, $config);
        }

        return (bool) $this->getAdapter()->writeStream($path, $resource, $config);
    }

    /**
     * @inheritdoc
     */
    public function readAndDelete($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);
        $contents = $this->read($path);

        if ($contents === false) {
            return false;
        }

        $this->delete($path);

        return $contents;
    }

    /**
     * @inheritdoc
     */
    public function update($path, $contents, array $config = [])
    {
        $path = Util::normalizePath($path);
        $config = $this->prepareConfig($config);

        $this->assertPresent($path);

        return (bool) $this->getAdapter()->update($path, $contents, $config);
    }

    /**
     * @inheritdoc
     */
    public function updateStream($path, $resource, array $config = [])
    {
        if ( ! is_resource($resource)) {
            throw new InvalidArgumentException(__METHOD__ . ' expects argument #2 to be a valid resource.');
        }

        $path = Util::normalizePath($path);
        $config = $this->prepareConfig($config);
        $this->assertPresent($path);
        Util::rewindStream($resource);

        return (bool) $this->getAdapter()->updateStream($path, $resource, $config);
    }

    /**
     * @inheritdoc
     */
    public function read($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        if ( ! ($object = $this->getAdapter()->read($path))) {
            return false;
        }

        return $object['contents'];
    }

    /**
     * @inheritdoc
     */
    public function readStream($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        if ( ! $object = $this->getAdapter()->readStream($path)) {
            return false;
        }

        return $object['stream'];
    }

    /**
     * @inheritdoc
     */
    public function rename($path, $newpath)
    {
        $path = Util::normalizePath($path);
        $newpath = Util::normalizePath($newpath);
        $this->assertPresent($path);
        $this->assertAbsent($newpath);

        return (bool) $this->getAdapter()->rename($path, $newpath);
    }

    /**
     * @inheritdoc
     */
    public function copy($path, $newpath)
    {
        $path = Util::normalizePath($path);
        $newpath = Util::normalizePath($newpath);
        $this->assertPresent($path);
        $this->assertAbsent($newpath);

        return $this->getAdapter()->copy($path, $newpath);
    }

    /**
     * @inheritdoc
     */
    public function delete($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        return $this->getAdapter()->delete($path);
    }

    /**
     * @inheritdoc
     */
    public function deleteDir($dirname)
    {
        $dirname = Util::normalizePath($dirname);

        if ($dirname === '') {
            throw new RootViolationException('Root directories can not be deleted.');
        }

        return (bool) $this->getAdapter()->deleteDir($dirname);
    }

    /**
     * @inheritdoc
     */
    public function createDir($dirname, array $config = [])
    {
        $dirname = Util::normalizePath($dirname);
        $config = $this->prepareConfig($config);

        return (bool) $this->getAdapter()->createDir($dirname, $config);
    }

    /**
     * @inheritdoc
     */
    public function listContents($directory = '', $recursive = false)
    {
        $directory = Util::normalizePath($directory);
        $contents = $this->getAdapter()->listContents($directory, $recursive);

        return (new ContentListingFormatter($directory, $recursive, $this->config->get('case_sensitive', true)))
            ->formatListing($contents);
    }

    /**
     * @inheritdoc
     */
    public function getMimetype($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        if (( ! $object = $this->getAdapter()->getMimetype($path)) || ! array_key_exists('mimetype', $object)) {
            return false;
        }

        return $object['mimetype'];
    }

    /**
     * @inheritdoc
     */
    public function getTimestamp($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        if (( ! $object = $this->getAdapter()->getTimestamp($path)) || ! array_key_exists('timestamp', $object)) {
            return false;
        }

        return $object['timestamp'];
    }

    /**
     * @inheritdoc
     */
    public function getVisibility($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        if (( ! $object = $this->getAdapter()->getVisibility($path)) || ! array_key_exists('visibility', $object)) {
            return false;
        }

        return $object['visibility'];
    }

    /**
     * @inheritdoc
     */
    public function getSize($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        if (( ! $object = $this->getAdapter()->getSize($path)) || ! array_key_exists('size', $object)) {
            return false;
        }

        return (int) $object['size'];
    }

    /**
     * @inheritdoc
     */
    public function setVisibility($path, $visibility)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        return (bool) $this->getAdapter()->setVisibility($path, $visibility);
    }

    /**
     * @inheritdoc
     */
    public function getMetadata($path)
    {
        $path = Util::normalizePath($path);
        $this->assertPresent($path);

        return $this->getAdapter()->getMetadata($path);
    }

    /**
     * @inheritdoc
     */
    public function get($path, Handler $handler = null)
    {
        $path = Util::normalizePath($path);

        if ( ! $handler) {
            $metadata = $this->getMetadata($path);
            $handler = $metadata['type'] === 'file' ? new File($this, $path) : new Directory($this, $path);
        }

        $handler->setPath($path);
        $handler->setFilesystem($this);

        return $handler;
    }

    /**
     * Assert a file is present.
     *
     * @param string $path path to file
     *
     * @throws FileNotFoundException
     *
     * @return void
     */
    public function assertPresent($path)
    {
        if ($this->config->get('disable_asserts', false) === false && ! $this->has($path)) {
            throw new FileNotFoundException($path);
        }
    }

    /**
     * Assert a file is absent.
     *
     * @param string $path path to file
     *
     * @throws FileExistsException
     *
     * @return void
     */
    public function assertAbsent($path)
    {
        if ($this->config->get('disable_asserts', false) === false && $this->has($path)) {
            throw new FileExistsException($path);
        }
    }
}
