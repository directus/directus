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

use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\Glob;

/**
 * GlobResource represents a set of resources stored on the filesystem.
 *
 * Only existence/removal is tracked (not mtimes.)
 *
 * @author Nicolas Grekas <p@tchwork.com>
 */
class GlobResource implements \IteratorAggregate, SelfCheckingResourceInterface, \Serializable
{
    private $prefix;
    private $pattern;
    private $recursive;
    private $hash;

    /**
     * @param string $prefix    A directory prefix
     * @param string $pattern   A glob pattern
     * @param bool   $recursive Whether directories should be scanned recursively or not
     *
     * @throws \InvalidArgumentException
     */
    public function __construct(?string $prefix, string $pattern, bool $recursive)
    {
        $this->prefix = realpath($prefix) ?: (file_exists($prefix) ? $prefix : false);
        $this->pattern = $pattern;
        $this->recursive = $recursive;

        if (false === $this->prefix) {
            throw new \InvalidArgumentException(sprintf('The path "%s" does not exist.', $prefix));
        }
    }

    public function getPrefix()
    {
        return $this->prefix;
    }

    /**
     * {@inheritdoc}
     */
    public function __toString()
    {
        return 'glob.'.$this->prefix.$this->pattern.(int) $this->recursive;
    }

    /**
     * {@inheritdoc}
     */
    public function isFresh($timestamp)
    {
        $hash = $this->computeHash();

        if (null === $this->hash) {
            $this->hash = $hash;
        }

        return $this->hash === $hash;
    }

    public function serialize()
    {
        if (null === $this->hash) {
            $this->hash = $this->computeHash();
        }

        return serialize(array($this->prefix, $this->pattern, $this->recursive, $this->hash));
    }

    public function unserialize($serialized)
    {
        list($this->prefix, $this->pattern, $this->recursive, $this->hash) = unserialize($serialized);
    }

    public function getIterator()
    {
        if (!file_exists($this->prefix) || (!$this->recursive && '' === $this->pattern)) {
            return;
        }

        if (0 !== strpos($this->prefix, 'phar://') && false === strpos($this->pattern, '/**/') && (\defined('GLOB_BRACE') || false === strpos($this->pattern, '{'))) {
            foreach (glob($this->prefix.$this->pattern, \defined('GLOB_BRACE') ? GLOB_BRACE : 0) as $path) {
                if ($this->recursive && is_dir($path)) {
                    $files = iterator_to_array(new \RecursiveIteratorIterator(
                        new \RecursiveCallbackFilterIterator(
                            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS),
                            function (\SplFileInfo $file) { return '.' !== $file->getBasename()[0]; }
                        ),
                        \RecursiveIteratorIterator::LEAVES_ONLY
                    ));
                    uasort($files, function (\SplFileInfo $a, \SplFileInfo $b) {
                        return (string) $a > (string) $b ? 1 : -1;
                    });

                    foreach ($files as $path => $info) {
                        if ($info->isFile()) {
                            yield $path => $info;
                        }
                    }
                } elseif (is_file($path)) {
                    yield $path => new \SplFileInfo($path);
                }
            }

            return;
        }

        if (!class_exists(Finder::class)) {
            throw new \LogicException(sprintf('Extended glob pattern "%s" cannot be used as the Finder component is not installed.', $this->pattern));
        }

        $finder = new Finder();
        $regex = Glob::toRegex($this->pattern);
        if ($this->recursive) {
            $regex = substr_replace($regex, '(/|$)', -2, 1);
        }

        $prefixLen = \strlen($this->prefix);
        foreach ($finder->followLinks()->sortByName()->in($this->prefix) as $path => $info) {
            if (preg_match($regex, substr('\\' === \DIRECTORY_SEPARATOR ? str_replace('\\', '/', $path) : $path, $prefixLen)) && $info->isFile()) {
                yield $path => $info;
            }
        }
    }

    private function computeHash()
    {
        $hash = hash_init('md5');

        foreach ($this->getIterator() as $path => $info) {
            hash_update($hash, $path."\n");
        }

        return hash_final($hash);
    }
}
