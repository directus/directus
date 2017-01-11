<?php

namespace League\Flysystem\Adapter;

use League\Flysystem\AdapterInterface;

abstract class AbstractAdapter implements AdapterInterface
{
    /**
     * @var string path prefix
     */
    protected $pathPrefix;

    /**
     * @var string
     */
    protected $pathSeparator = '/';

    /**
     * Set the path prefix.
     *
     * @param string $prefix
     *
     * @return void
     */
    public function setPathPrefix($prefix)
    {
        $is_empty = empty($prefix);

        if ( ! $is_empty) {
            $prefix = rtrim($prefix, '\\/') . $this->pathSeparator;
        }

        $this->pathPrefix = $is_empty ? null : $prefix;
    }

    /**
     * Get the path prefix.
     *
     * @return string path prefix
     */
    public function getPathPrefix()
    {
        return $this->pathPrefix;
    }

    /**
     * Prefix a path.
     *
     * @param string $path
     *
     * @return string prefixed path
     */
    public function applyPathPrefix($path)
    {
        $path = ltrim($path, '\\/');

        if (strlen($path) === 0) {
            return $this->getPathPrefix() ?: '';
        }

        if ($prefix = $this->getPathPrefix()) {
            $path = $prefix . $path;
        }

        return $path;
    }

    /**
     * Remove a path prefix.
     *
     * @param string $path
     *
     * @return string path without the prefix
     */
    public function removePathPrefix($path)
    {
        $pathPrefix = $this->getPathPrefix();

        if ($pathPrefix === null) {
            return $path;
        }

        return substr($path, strlen($pathPrefix));
    }
}
