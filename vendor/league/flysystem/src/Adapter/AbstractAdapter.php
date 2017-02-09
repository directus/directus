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
        $prefix = (string) $prefix;

        if ($prefix === '') {
            $this->pathPrefix = null;
            return;
        }

        $this->pathPrefix = rtrim($prefix, '\\/') . $this->pathSeparator;
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
        return $this->getPathPrefix() . ltrim($path, '\\/');
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
        return substr($path, strlen($this->getPathPrefix()));
    }
}
