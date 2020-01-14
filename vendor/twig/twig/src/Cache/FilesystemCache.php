<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Cache;

/**
 * Implements a cache on the filesystem.
 *
 * @author Andrew Tch <andrew@noop.lv>
 */
class FilesystemCache implements CacheInterface
{
    const FORCE_BYTECODE_INVALIDATION = 1;

    private $directory;
    private $options;

    public function __construct(string $directory, int $options = 0)
    {
        $this->directory = rtrim($directory, '\/').'/';
        $this->options = $options;
    }

    public function generateKey(string $name, string $className): string
    {
        $hash = hash('sha256', $className);

        return $this->directory.$hash[0].$hash[1].'/'.$hash.'.php';
    }

    public function load(string $key): void
    {
        if (file_exists($key)) {
            @include_once $key;
        }
    }

    public function write(string $key, string $content): void
    {
        $dir = \dirname($key);
        if (!is_dir($dir)) {
            if (false === @mkdir($dir, 0777, true)) {
                clearstatcache(true, $dir);
                if (!is_dir($dir)) {
                    throw new \RuntimeException(sprintf('Unable to create the cache directory (%s).', $dir));
                }
            }
        } elseif (!is_writable($dir)) {
            throw new \RuntimeException(sprintf('Unable to write in the cache directory (%s).', $dir));
        }

        $tmpFile = tempnam($dir, basename($key));
        if (false !== @file_put_contents($tmpFile, $content) && @rename($tmpFile, $key)) {
            @chmod($key, 0666 & ~umask());

            if (self::FORCE_BYTECODE_INVALIDATION == ($this->options & self::FORCE_BYTECODE_INVALIDATION)) {
                // Compile cached file into bytecode cache
                if (\function_exists('opcache_invalidate') && filter_var(ini_get('opcache.enable'), FILTER_VALIDATE_BOOLEAN)) {
                    @opcache_invalidate($key, true);
                } elseif (\function_exists('apc_compile_file')) {
                    apc_compile_file($key);
                }
            }

            return;
        }

        throw new \RuntimeException(sprintf('Failed to write cache file "%s".', $key));
    }

    public function getTimestamp(string $key): int
    {
        if (!file_exists($key)) {
            return 0;
        }

        return (int) @filemtime($key);
    }
}
