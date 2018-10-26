<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Loader;

use Symfony\Component\Config\Exception\FileLoaderImportCircularReferenceException;
use Symfony\Component\Config\Exception\FileLoaderLoadException;
use Symfony\Component\Config\Exception\FileLocatorFileNotFoundException;
use Symfony\Component\Config\FileLocatorInterface;
use Symfony\Component\Config\Resource\FileExistenceResource;
use Symfony\Component\Config\Resource\GlobResource;

/**
 * FileLoader is the abstract class used by all built-in loaders that are file based.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
abstract class FileLoader extends Loader
{
    protected static $loading = array();

    protected $locator;

    private $currentDir;

    public function __construct(FileLocatorInterface $locator)
    {
        $this->locator = $locator;
    }

    /**
     * Sets the current directory.
     *
     * @param string $dir
     */
    public function setCurrentDir($dir)
    {
        $this->currentDir = $dir;
    }

    /**
     * Returns the file locator used by this loader.
     *
     * @return FileLocatorInterface
     */
    public function getLocator()
    {
        return $this->locator;
    }

    /**
     * Imports a resource.
     *
     * @param mixed       $resource       A Resource
     * @param string|null $type           The resource type or null if unknown
     * @param bool        $ignoreErrors   Whether to ignore import errors or not
     * @param string|null $sourceResource The original resource importing the new resource
     *
     * @return mixed
     *
     * @throws FileLoaderLoadException
     * @throws FileLoaderImportCircularReferenceException
     * @throws FileLocatorFileNotFoundException
     */
    public function import($resource, $type = null, $ignoreErrors = false, $sourceResource = null)
    {
        if (\is_string($resource) && \strlen($resource) !== $i = strcspn($resource, '*?{[')) {
            $ret = array();
            $isSubpath = 0 !== $i && false !== strpos(substr($resource, 0, $i), '/');
            foreach ($this->glob($resource, false, $_, $ignoreErrors || !$isSubpath) as $path => $info) {
                if (null !== $res = $this->doImport($path, $type, $ignoreErrors, $sourceResource)) {
                    $ret[] = $res;
                }
                $isSubpath = true;
            }

            if ($isSubpath) {
                return isset($ret[1]) ? $ret : (isset($ret[0]) ? $ret[0] : null);
            }
        }

        return $this->doImport($resource, $type, $ignoreErrors, $sourceResource);
    }

    /**
     * @internal
     */
    protected function glob(string $pattern, bool $recursive, &$resource = null, bool $ignoreErrors = false)
    {
        if (\strlen($pattern) === $i = strcspn($pattern, '*?{[')) {
            $prefix = $pattern;
            $pattern = '';
        } elseif (0 === $i || false === strpos(substr($pattern, 0, $i), '/')) {
            $prefix = '.';
            $pattern = '/'.$pattern;
        } else {
            $prefix = \dirname(substr($pattern, 0, 1 + $i));
            $pattern = substr($pattern, \strlen($prefix));
        }

        try {
            $prefix = $this->locator->locate($prefix, $this->currentDir, true);
        } catch (FileLocatorFileNotFoundException $e) {
            if (!$ignoreErrors) {
                throw $e;
            }

            $resource = array();
            foreach ($e->getPaths() as $path) {
                $resource[] = new FileExistenceResource($path);
            }

            return;
        }
        $resource = new GlobResource($prefix, $pattern, $recursive);

        foreach ($resource as $path => $info) {
            yield $path => $info;
        }
    }

    private function doImport($resource, $type = null, bool $ignoreErrors = false, $sourceResource = null)
    {
        try {
            $loader = $this->resolve($resource, $type);

            if ($loader instanceof self && null !== $this->currentDir) {
                $resource = $loader->getLocator()->locate($resource, $this->currentDir, false);
            }

            $resources = \is_array($resource) ? $resource : array($resource);
            for ($i = 0; $i < $resourcesCount = \count($resources); ++$i) {
                if (isset(self::$loading[$resources[$i]])) {
                    if ($i == $resourcesCount - 1) {
                        throw new FileLoaderImportCircularReferenceException(array_keys(self::$loading));
                    }
                } else {
                    $resource = $resources[$i];
                    break;
                }
            }
            self::$loading[$resource] = true;

            try {
                $ret = $loader->load($resource, $type);
            } finally {
                unset(self::$loading[$resource]);
            }

            return $ret;
        } catch (FileLoaderImportCircularReferenceException $e) {
            throw $e;
        } catch (\Exception $e) {
            if (!$ignoreErrors) {
                // prevent embedded imports from nesting multiple exceptions
                if ($e instanceof FileLoaderLoadException) {
                    throw $e;
                }

                throw new FileLoaderLoadException($resource, $sourceResource, null, $e, $type);
            }
        }
    }
}
