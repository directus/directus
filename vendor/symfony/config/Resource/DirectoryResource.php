<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Resource;

/**
 * DirectoryResource represents a resources stored in a subdirectory tree.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class DirectoryResource implements SelfCheckingResourceInterface, \Serializable
{
    private $resource;
    private $pattern;

    /**
     * @param string      $resource The file path to the resource
     * @param string|null $pattern  A pattern to restrict monitored files
     *
     * @throws \InvalidArgumentException
     */
    public function __construct(string $resource, string $pattern = null)
    {
        $this->resource = realpath($resource) ?: (file_exists($resource) ? $resource : false);
        $this->pattern = $pattern;

        if (false === $this->resource || !is_dir($this->resource)) {
            throw new \InvalidArgumentException(sprintf('The directory "%s" does not exist.', $resource));
        }
    }

    /**
     * {@inheritdoc}
     */
    public function __toString()
    {
        return md5(serialize(array($this->resource, $this->pattern)));
    }

    /**
     * @return string The file path to the resource
     */
    public function getResource()
    {
        return $this->resource;
    }

    /**
     * Returns the pattern to restrict monitored files.
     *
     * @return string|null
     */
    public function getPattern()
    {
        return $this->pattern;
    }

    /**
     * {@inheritdoc}
     */
    public function isFresh($timestamp)
    {
        if (!is_dir($this->resource)) {
            return false;
        }

        if ($timestamp < filemtime($this->resource)) {
            return false;
        }

        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->resource), \RecursiveIteratorIterator::SELF_FIRST) as $file) {
            // if regex filtering is enabled only check matching files
            if ($this->pattern && $file->isFile() && !preg_match($this->pattern, $file->getBasename())) {
                continue;
            }

            // always monitor directories for changes, except the .. entries
            // (otherwise deleted files wouldn't get detected)
            if ($file->isDir() && '/..' === substr($file, -3)) {
                continue;
            }

            // for broken links
            try {
                $fileMTime = $file->getMTime();
            } catch (\RuntimeException $e) {
                continue;
            }

            // early return if a file's mtime exceeds the passed timestamp
            if ($timestamp < $fileMTime) {
                return false;
            }
        }

        return true;
    }

    public function serialize()
    {
        return serialize(array($this->resource, $this->pattern));
    }

    public function unserialize($serialized)
    {
        list($this->resource, $this->pattern) = unserialize($serialized);
    }
}
