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

use Symfony\Component\Config\Exception\FileLoaderLoadException;

/**
 * Loader is the abstract class used by all built-in loaders.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
abstract class Loader implements LoaderInterface
{
    protected $resolver;

    /**
     * {@inheritdoc}
     */
    public function getResolver()
    {
        return $this->resolver;
    }

    /**
     * {@inheritdoc}
     */
    public function setResolver(LoaderResolverInterface $resolver)
    {
        $this->resolver = $resolver;
    }

    /**
     * Imports a resource.
     *
     * @param mixed       $resource A resource
     * @param string|null $type     The resource type or null if unknown
     *
     * @return mixed
     */
    public function import($resource, $type = null)
    {
        return $this->resolve($resource, $type)->load($resource, $type);
    }

    /**
     * Finds a loader able to load an imported resource.
     *
     * @param mixed       $resource A resource
     * @param string|null $type     The resource type or null if unknown
     *
     * @return $this|LoaderInterface
     *
     * @throws FileLoaderLoadException If no loader is found
     */
    public function resolve($resource, $type = null)
    {
        if ($this->supports($resource, $type)) {
            return $this;
        }

        $loader = null === $this->resolver ? false : $this->resolver->resolve($resource, $type);

        if (false === $loader) {
            throw new FileLoaderLoadException($resource, null, null, null, $type);
        }

        return $loader;
    }
}
