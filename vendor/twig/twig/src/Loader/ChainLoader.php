<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Loader;

use Twig\Error\LoaderError;
use Twig\Source;

/**
 * Loads templates from other loaders.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class ChainLoader implements LoaderInterface
{
    private $hasSourceCache = [];
    private $loaders = [];

    /**
     * @param LoaderInterface[] $loaders
     */
    public function __construct(array $loaders = [])
    {
        foreach ($loaders as $loader) {
            $this->addLoader($loader);
        }
    }

    public function addLoader(LoaderInterface $loader): void
    {
        $this->loaders[] = $loader;
        $this->hasSourceCache = [];
    }

    /**
     * @return LoaderInterface[]
     */
    public function getLoaders(): array
    {
        return $this->loaders;
    }

    public function getSourceContext(string $name): Source
    {
        $exceptions = [];
        foreach ($this->loaders as $loader) {
            if (!$loader->exists($name)) {
                continue;
            }

            try {
                return $loader->getSourceContext($name);
            } catch (LoaderError $e) {
                $exceptions[] = $e->getMessage();
            }
        }

        throw new LoaderError(sprintf('Template "%s" is not defined%s.', $name, $exceptions ? ' ('.implode(', ', $exceptions).')' : ''));
    }

    public function exists(string $name): bool
    {
        if (isset($this->hasSourceCache[$name])) {
            return $this->hasSourceCache[$name];
        }

        foreach ($this->loaders as $loader) {
            if ($loader->exists($name)) {
                return $this->hasSourceCache[$name] = true;
            }
        }

        return $this->hasSourceCache[$name] = false;
    }

    public function getCacheKey(string $name): string
    {
        $exceptions = [];
        foreach ($this->loaders as $loader) {
            if (!$loader->exists($name)) {
                continue;
            }

            try {
                return $loader->getCacheKey($name);
            } catch (LoaderError $e) {
                $exceptions[] = \get_class($loader).': '.$e->getMessage();
            }
        }

        throw new LoaderError(sprintf('Template "%s" is not defined%s.', $name, $exceptions ? ' ('.implode(', ', $exceptions).')' : ''));
    }

    public function isFresh(string $name, int $time): bool
    {
        $exceptions = [];
        foreach ($this->loaders as $loader) {
            if (!$loader->exists($name)) {
                continue;
            }

            try {
                return $loader->isFresh($name, $time);
            } catch (LoaderError $e) {
                $exceptions[] = \get_class($loader).': '.$e->getMessage();
            }
        }

        throw new LoaderError(sprintf('Template "%s" is not defined%s.', $name, $exceptions ? ' ('.implode(', ', $exceptions).')' : ''));
    }
}
