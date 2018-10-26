<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config;

use Symfony\Component\Config\Exception\FileLocatorFileNotFoundException;

/**
 * FileLocator uses an array of pre-defined paths to find files.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class FileLocator implements FileLocatorInterface
{
    protected $paths;

    /**
     * @param string|string[] $paths A path or an array of paths where to look for resources
     */
    public function __construct($paths = array())
    {
        $this->paths = (array) $paths;
    }

    /**
     * {@inheritdoc}
     */
    public function locate($name, $currentPath = null, $first = true)
    {
        if ('' == $name) {
            throw new \InvalidArgumentException('An empty file name is not valid to be located.');
        }

        if ($this->isAbsolutePath($name)) {
            if (!file_exists($name)) {
                throw new FileLocatorFileNotFoundException(sprintf('The file "%s" does not exist.', $name), 0, null, array($name));
            }

            return $name;
        }

        $paths = $this->paths;

        if (null !== $currentPath) {
            array_unshift($paths, $currentPath);
        }

        $paths = array_unique($paths);
        $filepaths = $notfound = array();

        foreach ($paths as $path) {
            if (@file_exists($file = $path.\DIRECTORY_SEPARATOR.$name)) {
                if (true === $first) {
                    return $file;
                }
                $filepaths[] = $file;
            } else {
                $notfound[] = $file;
            }
        }

        if (!$filepaths) {
            throw new FileLocatorFileNotFoundException(sprintf('The file "%s" does not exist (in: %s).', $name, implode(', ', $paths)), 0, null, $notfound);
        }

        return $filepaths;
    }

    /**
     * Returns whether the file path is an absolute path.
     *
     * @param string $file A file path
     *
     * @return bool
     */
    private function isAbsolutePath($file)
    {
        if ('/' === $file[0] || '\\' === $file[0]
            || (\strlen($file) > 3 && ctype_alpha($file[0])
                && ':' === $file[1]
                && ('\\' === $file[2] || '/' === $file[2])
            )
            || null !== parse_url($file, PHP_URL_SCHEME)
        ) {
            return true;
        }

        return false;
    }
}
