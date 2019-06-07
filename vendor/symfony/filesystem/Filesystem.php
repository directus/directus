<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Filesystem;

use Symfony\Component\Filesystem\Exception\FileNotFoundException;
use Symfony\Component\Filesystem\Exception\InvalidArgumentException;
use Symfony\Component\Filesystem\Exception\IOException;

/**
 * Provides basic utility to manipulate the file system.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Filesystem
{
    private static $lastError;

    /**
     * Copies a file.
     *
     * If the target file is older than the origin file, it's always overwritten.
     * If the target file is newer, it is overwritten only when the
     * $overwriteNewerFiles option is set to true.
     *
     * @param string $originFile          The original filename
     * @param string $targetFile          The target filename
     * @param bool   $overwriteNewerFiles If true, target files newer than origin files are overwritten
     *
     * @throws FileNotFoundException When originFile doesn't exist
     * @throws IOException           When copy fails
     */
    public function copy($originFile, $targetFile, $overwriteNewerFiles = false)
    {
        $originIsLocal = stream_is_local($originFile) || 0 === stripos($originFile, 'file://');
        if ($originIsLocal && !is_file($originFile)) {
            throw new FileNotFoundException(sprintf('Failed to copy "%s" because file does not exist.', $originFile), 0, null, $originFile);
        }

        $this->mkdir(\dirname($targetFile));

        $doCopy = true;
        if (!$overwriteNewerFiles && null === parse_url($originFile, PHP_URL_HOST) && is_file($targetFile)) {
            $doCopy = filemtime($originFile) > filemtime($targetFile);
        }

        if ($doCopy) {
            // https://bugs.php.net/bug.php?id=64634
            if (false === $source = @fopen($originFile, 'r')) {
                throw new IOException(sprintf('Failed to copy "%s" to "%s" because source file could not be opened for reading.', $originFile, $targetFile), 0, null, $originFile);
            }

            // Stream context created to allow files overwrite when using FTP stream wrapper - disabled by default
            if (false === $target = @fopen($targetFile, 'w', null, stream_context_create(['ftp' => ['overwrite' => true]]))) {
                throw new IOException(sprintf('Failed to copy "%s" to "%s" because target file could not be opened for writing.', $originFile, $targetFile), 0, null, $originFile);
            }

            $bytesCopied = stream_copy_to_stream($source, $target);
            fclose($source);
            fclose($target);
            unset($source, $target);

            if (!is_file($targetFile)) {
                throw new IOException(sprintf('Failed to copy "%s" to "%s".', $originFile, $targetFile), 0, null, $originFile);
            }

            if ($originIsLocal) {
                // Like `cp`, preserve executable permission bits
                @chmod($targetFile, fileperms($targetFile) | (fileperms($originFile) & 0111));

                if ($bytesCopied !== $bytesOrigin = filesize($originFile)) {
                    throw new IOException(sprintf('Failed to copy the whole content of "%s" to "%s" (%g of %g bytes copied).', $originFile, $targetFile, $bytesCopied, $bytesOrigin), 0, null, $originFile);
                }
            }
        }
    }

    /**
     * Creates a directory recursively.
     *
     * @param string|iterable $dirs The directory path
     * @param int             $mode The directory mode
     *
     * @throws IOException On any directory creation failure
     */
    public function mkdir($dirs, $mode = 0777)
    {
        foreach ($this->toIterable($dirs) as $dir) {
            if (is_dir($dir)) {
                continue;
            }

            if (!self::box('mkdir', $dir, $mode, true)) {
                if (!is_dir($dir)) {
                    // The directory was not created by a concurrent process. Let's throw an exception with a developer friendly error message if we have one
                    if (self::$lastError) {
                        throw new IOException(sprintf('Failed to create "%s": %s.', $dir, self::$lastError), 0, null, $dir);
                    }
                    throw new IOException(sprintf('Failed to create "%s"', $dir), 0, null, $dir);
                }
            }
        }
    }

    /**
     * Checks the existence of files or directories.
     *
     * @param string|iterable $files A filename, an array of files, or a \Traversable instance to check
     *
     * @return bool true if the file exists, false otherwise
     */
    public function exists($files)
    {
        $maxPathLength = PHP_MAXPATHLEN - 2;

        foreach ($this->toIterable($files) as $file) {
            if (\strlen($file) > $maxPathLength) {
                throw new IOException(sprintf('Could not check if file exist because path length exceeds %d characters.', $maxPathLength), 0, null, $file);
            }

            if (!file_exists($file)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sets access and modification time of file.
     *
     * @param string|iterable $files A filename, an array of files, or a \Traversable instance to create
     * @param int|null        $time  The touch time as a Unix timestamp, if not supplied the current system time is used
     * @param int|null        $atime The access time as a Unix timestamp, if not supplied the current system time is used
     *
     * @throws IOException When touch fails
     */
    public function touch($files, $time = null, $atime = null)
    {
        foreach ($this->toIterable($files) as $file) {
            $touch = $time ? @touch($file, $time, $atime) : @touch($file);
            if (true !== $touch) {
                throw new IOException(sprintf('Failed to touch "%s".', $file), 0, null, $file);
            }
        }
    }

    /**
     * Removes files or directories.
     *
     * @param string|iterable $files A filename, an array of files, or a \Traversable instance to remove
     *
     * @throws IOException When removal fails
     */
    public function remove($files)
    {
        if ($files instanceof \Traversable) {
            $files = iterator_to_array($files, false);
        } elseif (!\is_array($files)) {
            $files = [$files];
        }
        $files = array_reverse($files);
        foreach ($files as $file) {
            if (is_link($file)) {
                // See https://bugs.php.net/52176
                if (!(self::box('unlink', $file) || '\\' !== \DIRECTORY_SEPARATOR || self::box('rmdir', $file)) && file_exists($file)) {
                    throw new IOException(sprintf('Failed to remove symlink "%s": %s.', $file, self::$lastError));
                }
            } elseif (is_dir($file)) {
                $this->remove(new \FilesystemIterator($file, \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS));

                if (!self::box('rmdir', $file) && file_exists($file)) {
                    throw new IOException(sprintf('Failed to remove directory "%s": %s.', $file, self::$lastError));
                }
            } elseif (!self::box('unlink', $file) && file_exists($file)) {
                throw new IOException(sprintf('Failed to remove file "%s": %s.', $file, self::$lastError));
            }
        }
    }

    /**
     * Change mode for an array of files or directories.
     *
     * @param string|iterable $files     A filename, an array of files, or a \Traversable instance to change mode
     * @param int             $mode      The new mode (octal)
     * @param int             $umask     The mode mask (octal)
     * @param bool            $recursive Whether change the mod recursively or not
     *
     * @throws IOException When the change fails
     */
    public function chmod($files, $mode, $umask = 0000, $recursive = false)
    {
        foreach ($this->toIterable($files) as $file) {
            if (true !== @chmod($file, $mode & ~$umask)) {
                throw new IOException(sprintf('Failed to chmod file "%s".', $file), 0, null, $file);
            }
            if ($recursive && is_dir($file) && !is_link($file)) {
                $this->chmod(new \FilesystemIterator($file), $mode, $umask, true);
            }
        }
    }

    /**
     * Change the owner of an array of files or directories.
     *
     * @param string|iterable $files     A filename, an array of files, or a \Traversable instance to change owner
     * @param string          $user      The new owner user name
     * @param bool            $recursive Whether change the owner recursively or not
     *
     * @throws IOException When the change fails
     */
    public function chown($files, $user, $recursive = false)
    {
        foreach ($this->toIterable($files) as $file) {
            if ($recursive && is_dir($file) && !is_link($file)) {
                $this->chown(new \FilesystemIterator($file), $user, true);
            }
            if (is_link($file) && \function_exists('lchown')) {
                if (true !== @lchown($file, $user)) {
                    throw new IOException(sprintf('Failed to chown file "%s".', $file), 0, null, $file);
                }
            } else {
                if (true !== @chown($file, $user)) {
                    throw new IOException(sprintf('Failed to chown file "%s".', $file), 0, null, $file);
                }
            }
        }
    }

    /**
     * Change the group of an array of files or directories.
     *
     * @param string|iterable $files     A filename, an array of files, or a \Traversable instance to change group
     * @param string          $group     The group name
     * @param bool            $recursive Whether change the group recursively or not
     *
     * @throws IOException When the change fails
     */
    public function chgrp($files, $group, $recursive = false)
    {
        foreach ($this->toIterable($files) as $file) {
            if ($recursive && is_dir($file) && !is_link($file)) {
                $this->chgrp(new \FilesystemIterator($file), $group, true);
            }
            if (is_link($file) && \function_exists('lchgrp')) {
                if (true !== @lchgrp($file, $group)) {
                    throw new IOException(sprintf('Failed to chgrp file "%s".', $file), 0, null, $file);
                }
            } else {
                if (true !== @chgrp($file, $group)) {
                    throw new IOException(sprintf('Failed to chgrp file "%s".', $file), 0, null, $file);
                }
            }
        }
    }

    /**
     * Renames a file or a directory.
     *
     * @param string $origin    The origin filename or directory
     * @param string $target    The new filename or directory
     * @param bool   $overwrite Whether to overwrite the target if it already exists
     *
     * @throws IOException When target file or directory already exists
     * @throws IOException When origin cannot be renamed
     */
    public function rename($origin, $target, $overwrite = false)
    {
        // we check that target does not exist
        if (!$overwrite && $this->isReadable($target)) {
            throw new IOException(sprintf('Cannot rename because the target "%s" already exists.', $target), 0, null, $target);
        }

        if (true !== @rename($origin, $target)) {
            if (is_dir($origin)) {
                // See https://bugs.php.net/bug.php?id=54097 & http://php.net/manual/en/function.rename.php#113943
                $this->mirror($origin, $target, null, ['override' => $overwrite, 'delete' => $overwrite]);
                $this->remove($origin);

                return;
            }
            throw new IOException(sprintf('Cannot rename "%s" to "%s".', $origin, $target), 0, null, $target);
        }
    }

    /**
     * Tells whether a file exists and is readable.
     *
     * @param string $filename Path to the file
     *
     * @return bool
     *
     * @throws IOException When windows path is longer than 258 characters
     */
    private function isReadable($filename)
    {
        $maxPathLength = PHP_MAXPATHLEN - 2;

        if (\strlen($filename) > $maxPathLength) {
            throw new IOException(sprintf('Could not check if file is readable because path length exceeds %d characters.', $maxPathLength), 0, null, $filename);
        }

        return is_readable($filename);
    }

    /**
     * Creates a symbolic link or copy a directory.
     *
     * @param string $originDir     The origin directory path
     * @param string $targetDir     The symbolic link name
     * @param bool   $copyOnWindows Whether to copy files if on Windows
     *
     * @throws IOException When symlink fails
     */
    public function symlink($originDir, $targetDir, $copyOnWindows = false)
    {
        if ('\\' === \DIRECTORY_SEPARATOR) {
            $originDir = strtr($originDir, '/', '\\');
            $targetDir = strtr($targetDir, '/', '\\');

            if ($copyOnWindows) {
                $this->mirror($originDir, $targetDir);

                return;
            }
        }

        $this->mkdir(\dirname($targetDir));

        if (is_link($targetDir)) {
            if (readlink($targetDir) === $originDir) {
                return;
            }
            $this->remove($targetDir);
        }

        if (!self::box('symlink', $originDir, $targetDir)) {
            $this->linkException($originDir, $targetDir, 'symbolic');
        }
    }

    /**
     * Creates a hard link, or several hard links to a file.
     *
     * @param string          $originFile  The original file
     * @param string|string[] $targetFiles The target file(s)
     *
     * @throws FileNotFoundException When original file is missing or not a file
     * @throws IOException           When link fails, including if link already exists
     */
    public function hardlink($originFile, $targetFiles)
    {
        if (!$this->exists($originFile)) {
            throw new FileNotFoundException(null, 0, null, $originFile);
        }

        if (!is_file($originFile)) {
            throw new FileNotFoundException(sprintf('Origin file "%s" is not a file', $originFile));
        }

        foreach ($this->toIterable($targetFiles) as $targetFile) {
            if (is_file($targetFile)) {
                if (fileinode($originFile) === fileinode($targetFile)) {
                    continue;
                }
                $this->remove($targetFile);
            }

            if (!self::box('link', $originFile, $targetFile)) {
                $this->linkException($originFile, $targetFile, 'hard');
            }
        }
    }

    /**
     * @param string $origin
     * @param string $target
     * @param string $linkType Name of the link type, typically 'symbolic' or 'hard'
     */
    private function linkException($origin, $target, $linkType)
    {
        if (self::$lastError) {
            if ('\\' === \DIRECTORY_SEPARATOR && false !== strpos(self::$lastError, 'error code(1314)')) {
                throw new IOException(sprintf('Unable to create %s link due to error code 1314: \'A required privilege is not held by the client\'. Do you have the required Administrator-rights?', $linkType), 0, null, $target);
            }
        }
        throw new IOException(sprintf('Failed to create %s link from "%s" to "%s".', $linkType, $origin, $target), 0, null, $target);
    }

    /**
     * Resolves links in paths.
     *
     * With $canonicalize = false (default)
     *      - if $path does not exist or is not a link, returns null
     *      - if $path is a link, returns the next direct target of the link without considering the existence of the target
     *
     * With $canonicalize = true
     *      - if $path does not exist, returns null
     *      - if $path exists, returns its absolute fully resolved final version
     *
     * @param string $path         A filesystem path
     * @param bool   $canonicalize Whether or not to return a canonicalized path
     *
     * @return string|null
     */
    public function readlink($path, $canonicalize = false)
    {
        if (!$canonicalize && !is_link($path)) {
            return;
        }

        if ($canonicalize) {
            if (!$this->exists($path)) {
                return;
            }

            if ('\\' === \DIRECTORY_SEPARATOR) {
                $path = readlink($path);
            }

            return realpath($path);
        }

        if ('\\' === \DIRECTORY_SEPARATOR) {
            return realpath($path);
        }

        return readlink($path);
    }

    /**
     * Given an existing path, convert it to a path relative to a given starting path.
     *
     * @param string $endPath   Absolute path of target
     * @param string $startPath Absolute path where traversal begins
     *
     * @return string Path of target relative to starting path
     */
    public function makePathRelative($endPath, $startPath)
    {
        if (!$this->isAbsolutePath($startPath)) {
            throw new InvalidArgumentException(sprintf('The start path "%s" is not absolute.', $startPath));
        }

        if (!$this->isAbsolutePath($endPath)) {
            throw new InvalidArgumentException(sprintf('The end path "%s" is not absolute.', $endPath));
        }

        // Normalize separators on Windows
        if ('\\' === \DIRECTORY_SEPARATOR) {
            $endPath = str_replace('\\', '/', $endPath);
            $startPath = str_replace('\\', '/', $startPath);
        }

        $stripDriveLetter = function ($path) {
            if (\strlen($path) > 2 && ':' === $path[1] && '/' === $path[2] && ctype_alpha($path[0])) {
                return substr($path, 2);
            }

            return $path;
        };

        $endPath = $stripDriveLetter($endPath);
        $startPath = $stripDriveLetter($startPath);

        // Split the paths into arrays
        $startPathArr = explode('/', trim($startPath, '/'));
        $endPathArr = explode('/', trim($endPath, '/'));

        $normalizePathArray = function ($pathSegments) {
            $result = [];

            foreach ($pathSegments as $segment) {
                if ('..' === $segment) {
                    array_pop($result);
                } elseif ('.' !== $segment) {
                    $result[] = $segment;
                }
            }

            return $result;
        };

        $startPathArr = $normalizePathArray($startPathArr);
        $endPathArr = $normalizePathArray($endPathArr);

        // Find for which directory the common path stops
        $index = 0;
        while (isset($startPathArr[$index]) && isset($endPathArr[$index]) && $startPathArr[$index] === $endPathArr[$index]) {
            ++$index;
        }

        // Determine how deep the start path is relative to the common path (ie, "web/bundles" = 2 levels)
        if (1 === \count($startPathArr) && '' === $startPathArr[0]) {
            $depth = 0;
        } else {
            $depth = \count($startPathArr) - $index;
        }

        // Repeated "../" for each level need to reach the common path
        $traverser = str_repeat('../', $depth);

        $endPathRemainder = implode('/', \array_slice($endPathArr, $index));

        // Construct $endPath from traversing to the common path, then to the remaining $endPath
        $relativePath = $traverser.('' !== $endPathRemainder ? $endPathRemainder.'/' : '');

        return '' === $relativePath ? './' : $relativePath;
    }

    /**
     * Mirrors a directory to another.
     *
     * Copies files and directories from the origin directory into the target directory. By default:
     *
     *  - existing files in the target directory will be overwritten, except if they are newer (see the `override` option)
     *  - files in the target directory that do not exist in the source directory will not be deleted (see the `delete` option)
     *
     * @param string            $originDir The origin directory
     * @param string            $targetDir The target directory
     * @param \Traversable|null $iterator  Iterator that filters which files and directories to copy, if null a recursive iterator is created
     * @param array             $options   An array of boolean options
     *                                     Valid options are:
     *                                     - $options['override'] If true, target files newer than origin files are overwritten (see copy(), defaults to false)
     *                                     - $options['copy_on_windows'] Whether to copy files instead of links on Windows (see symlink(), defaults to false)
     *                                     - $options['delete'] Whether to delete files that are not in the source directory (defaults to false)
     *
     * @throws IOException When file type is unknown
     */
    public function mirror($originDir, $targetDir, \Traversable $iterator = null, $options = [])
    {
        $targetDir = rtrim($targetDir, '/\\');
        $originDir = rtrim($originDir, '/\\');
        $originDirLen = \strlen($originDir);

        if (!$this->exists($originDir)) {
            throw new IOException(sprintf('The origin directory specified "%s" was not found.', $originDir), 0, null, $originDir);
        }

        // Iterate in destination folder to remove obsolete entries
        if ($this->exists($targetDir) && isset($options['delete']) && $options['delete']) {
            $deleteIterator = $iterator;
            if (null === $deleteIterator) {
                $flags = \FilesystemIterator::SKIP_DOTS;
                $deleteIterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($targetDir, $flags), \RecursiveIteratorIterator::CHILD_FIRST);
            }
            $targetDirLen = \strlen($targetDir);
            foreach ($deleteIterator as $file) {
                $origin = $originDir.substr($file->getPathname(), $targetDirLen);
                if (!$this->exists($origin)) {
                    $this->remove($file);
                }
            }
        }

        $copyOnWindows = $options['copy_on_windows'] ?? false;

        if (null === $iterator) {
            $flags = $copyOnWindows ? \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS : \FilesystemIterator::SKIP_DOTS;
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($originDir, $flags), \RecursiveIteratorIterator::SELF_FIRST);
        }

        $this->mkdir($targetDir);
        $targetDirInfo = new \SplFileInfo($targetDir);

        foreach ($iterator as $file) {
            if ($file->getPathname() === $targetDir || $file->getRealPath() === $targetDir || 0 === strpos($file->getRealPath(), $targetDirInfo->getRealPath())) {
                continue;
            }

            $target = $targetDir.substr($file->getPathname(), $originDirLen);

            if (!$copyOnWindows && is_link($file)) {
                $this->symlink($file->getLinkTarget(), $target);
            } elseif (is_dir($file)) {
                $this->mkdir($target);
            } elseif (is_file($file)) {
                $this->copy($file, $target, isset($options['override']) ? $options['override'] : false);
            } else {
                throw new IOException(sprintf('Unable to guess "%s" file type.', $file), 0, null, $file);
            }
        }
    }

    /**
     * Returns whether the file path is an absolute path.
     *
     * @param string $file A file path
     *
     * @return bool
     */
    public function isAbsolutePath($file)
    {
        return strspn($file, '/\\', 0, 1)
            || (\strlen($file) > 3 && ctype_alpha($file[0])
                && ':' === $file[1]
                && strspn($file, '/\\', 2, 1)
            )
            || null !== parse_url($file, PHP_URL_SCHEME)
        ;
    }

    /**
     * Creates a temporary file with support for custom stream wrappers.
     *
     * @param string $dir    The directory where the temporary filename will be created
     * @param string $prefix The prefix of the generated temporary filename
     *                       Note: Windows uses only the first three characters of prefix
     *
     * @return string The new temporary filename (with path), or throw an exception on failure
     */
    public function tempnam($dir, $prefix)
    {
        list($scheme, $hierarchy) = $this->getSchemeAndHierarchy($dir);

        // If no scheme or scheme is "file" or "gs" (Google Cloud) create temp file in local filesystem
        if (null === $scheme || 'file' === $scheme || 'gs' === $scheme) {
            $tmpFile = @tempnam($hierarchy, $prefix);

            // If tempnam failed or no scheme return the filename otherwise prepend the scheme
            if (false !== $tmpFile) {
                if (null !== $scheme && 'gs' !== $scheme) {
                    return $scheme.'://'.$tmpFile;
                }

                return $tmpFile;
            }

            throw new IOException('A temporary file could not be created.');
        }

        // Loop until we create a valid temp file or have reached 10 attempts
        for ($i = 0; $i < 10; ++$i) {
            // Create a unique filename
            $tmpFile = $dir.'/'.$prefix.uniqid(mt_rand(), true);

            // Use fopen instead of file_exists as some streams do not support stat
            // Use mode 'x+' to atomically check existence and create to avoid a TOCTOU vulnerability
            $handle = @fopen($tmpFile, 'x+');

            // If unsuccessful restart the loop
            if (false === $handle) {
                continue;
            }

            // Close the file if it was successfully opened
            @fclose($handle);

            return $tmpFile;
        }

        throw new IOException('A temporary file could not be created.');
    }

    /**
     * Atomically dumps content into a file.
     *
     * @param string          $filename The file to be written to
     * @param string|resource $content  The data to write into the file
     *
     * @throws IOException if the file cannot be written to
     */
    public function dumpFile($filename, $content)
    {
        if (\is_array($content)) {
            @trigger_error(sprintf('Calling "%s()" with an array in the $content argument is deprecated since Symfony 4.3.', __METHOD__), E_USER_DEPRECATED);
        }

        $dir = \dirname($filename);

        if (!is_dir($dir)) {
            $this->mkdir($dir);
        }

        if (!is_writable($dir)) {
            throw new IOException(sprintf('Unable to write to the "%s" directory.', $dir), 0, null, $dir);
        }

        // Will create a temp file with 0600 access rights
        // when the filesystem supports chmod.
        $tmpFile = $this->tempnam($dir, basename($filename));

        if (false === @file_put_contents($tmpFile, $content)) {
            throw new IOException(sprintf('Failed to write file "%s".', $filename), 0, null, $filename);
        }

        @chmod($tmpFile, file_exists($filename) ? fileperms($filename) : 0666 & ~umask());

        $this->rename($tmpFile, $filename, true);
    }

    /**
     * Appends content to an existing file.
     *
     * @param string          $filename The file to which to append content
     * @param string|resource $content  The content to append
     *
     * @throws IOException If the file is not writable
     */
    public function appendToFile($filename, $content)
    {
        if (\is_array($content)) {
            @trigger_error(sprintf('Calling "%s()" with an array in the $content argument is deprecated since Symfony 4.3.', __METHOD__), E_USER_DEPRECATED);
        }

        $dir = \dirname($filename);

        if (!is_dir($dir)) {
            $this->mkdir($dir);
        }

        if (!is_writable($dir)) {
            throw new IOException(sprintf('Unable to write to the "%s" directory.', $dir), 0, null, $dir);
        }

        if (false === @file_put_contents($filename, $content, FILE_APPEND)) {
            throw new IOException(sprintf('Failed to write file "%s".', $filename), 0, null, $filename);
        }
    }

    private function toIterable($files): iterable
    {
        return \is_array($files) || $files instanceof \Traversable ? $files : [$files];
    }

    /**
     * Gets a 2-tuple of scheme (may be null) and hierarchical part of a filename (e.g. file:///tmp -> [file, tmp]).
     */
    private function getSchemeAndHierarchy(string $filename): array
    {
        $components = explode('://', $filename, 2);

        return 2 === \count($components) ? [$components[0], $components[1]] : [null, $components[0]];
    }

    private static function box($func)
    {
        self::$lastError = null;
        \set_error_handler(__CLASS__.'::handleError');
        try {
            $result = $func(...\array_slice(\func_get_args(), 1));
            \restore_error_handler();

            return $result;
        } catch (\Throwable $e) {
        }
        \restore_error_handler();

        throw $e;
    }

    /**
     * @internal
     */
    public static function handleError($type, $msg)
    {
        self::$lastError = $msg;
    }
}
