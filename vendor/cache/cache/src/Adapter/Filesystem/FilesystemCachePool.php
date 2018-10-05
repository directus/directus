<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Filesystem;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\Exception\InvalidArgumentException;
use Cache\Adapter\Common\PhpCacheItem;
use League\Flysystem\FileExistsException;
use League\Flysystem\FileNotFoundException;
use League\Flysystem\Filesystem;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class FilesystemCachePool extends AbstractCachePool
{
    /**
     * @type Filesystem
     */
    private $filesystem;

    /**
     * The folder should not begin nor end with a slash. Example: path/to/cache.
     *
     * @type string
     */
    private $folder;

    /**
     * @param Filesystem $filesystem
     * @param string     $folder
     */
    public function __construct(Filesystem $filesystem, $folder = 'cache')
    {
        $this->folder = $folder;

        $this->filesystem = $filesystem;
        $this->filesystem->createDir($this->folder);
    }

    /**
     * @param string $folder
     */
    public function setFolder($folder)
    {
        $this->folder = $folder;
    }

    /**
     * {@inheritdoc}
     */
    protected function fetchObjectFromCache($key)
    {
        $empty = [false, null, [], null];
        $file  = $this->getFilePath($key);

        try {
            $data = @unserialize($this->filesystem->read($file));
            if ($data === false) {
                return $empty;
            }
        } catch (FileNotFoundException $e) {
            return $empty;
        }

        // Determine expirationTimestamp from data, remove items if expired
        $expirationTimestamp = $data[2] ?: null;
        if ($expirationTimestamp !== null && time() > $expirationTimestamp) {
            foreach ($data[1] as $tag) {
                $this->removeListItem($this->getTagKey($tag), $key);
            }
            $this->forceClear($key);

            return $empty;
        }

        return [true, $data[0], $data[1], $expirationTimestamp];
    }

    /**
     * {@inheritdoc}
     */
    protected function clearAllObjectsFromCache()
    {
        $this->filesystem->deleteDir($this->folder);
        $this->filesystem->createDir($this->folder);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        return $this->forceClear($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        $data = serialize(
            [
                $item->get(),
                $item->getTags(),
                $item->getExpirationTimestamp(),
            ]
        );

        $file = $this->getFilePath($item->getKey());
        if ($this->filesystem->has($file)) {
            // Update file if it exists
            return $this->filesystem->update($file, $data);
        }

        try {
            return $this->filesystem->write($file, $data);
        } catch (FileExistsException $e) {
            // To handle issues when/if race conditions occurs, we try to update here.
            return $this->filesystem->update($file, $data);
        }
    }

    /**
     * @param string $key
     *
     * @throws InvalidArgumentException
     *
     * @return string
     */
    private function getFilePath($key)
    {
        if (!preg_match('|^[a-zA-Z0-9_\.! ]+$|', $key)) {
            throw new InvalidArgumentException(sprintf('Invalid key "%s". Valid filenames must match [a-zA-Z0-9_\.! ].', $key));
        }

        return sprintf('%s/%s', $this->folder, $key);
    }

    /**
     * {@inheritdoc}
     */
    protected function getList($name)
    {
        $file = $this->getFilePath($name);

        if (!$this->filesystem->has($file)) {
            $this->filesystem->write($file, serialize([]));
        }

        return unserialize($this->filesystem->read($file));
    }

    /**
     * {@inheritdoc}
     */
    protected function removeList($name)
    {
        $file = $this->getFilePath($name);
        $this->filesystem->delete($file);
    }

    /**
     * {@inheritdoc}
     */
    protected function appendListItem($name, $key)
    {
        $list   = $this->getList($name);
        $list[] = $key;

        return $this->filesystem->update($this->getFilePath($name), serialize($list));
    }

    /**
     * {@inheritdoc}
     */
    protected function removeListItem($name, $key)
    {
        $list = $this->getList($name);
        foreach ($list as $i => $item) {
            if ($item === $key) {
                unset($list[$i]);
            }
        }

        return $this->filesystem->update($this->getFilePath($name), serialize($list));
    }

    /**
     * @param $key
     *
     * @return bool
     */
    private function forceClear($key)
    {
        try {
            return $this->filesystem->delete($this->getFilePath($key));
        } catch (FileNotFoundException $e) {
            return true;
        }
    }
}
