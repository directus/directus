<?php
/*
 * This file is part of the File_Iterator package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * FilterIterator implementation that filters files based on prefix(es) and/or
 * suffix(es). Hidden files and files from hidden directories are also filtered.
 *
 * @since     Class available since Release 1.0.0
 */
class File_Iterator extends FilterIterator
{
    const PREFIX = 0;
    const SUFFIX = 1;

    /**
     * @var array
     */
    protected $suffixes = array();

    /**
     * @var array
     */
    protected $prefixes = array();

    /**
     * @var array
     */
    protected $exclude = array();

    /**
     * @var string
     */
    protected $basepath;

    /**
     * @param Iterator $iterator
     * @param array    $suffixes
     * @param array    $prefixes
     * @param array    $exclude
     * @param string   $basepath
     */
    public function __construct(Iterator $iterator, array $suffixes = array(), array $prefixes = array(), array $exclude = array(), $basepath = NULL)
    {
        $exclude = array_filter(array_map('realpath', $exclude));

        if ($basepath !== NULL) {
            $basepath = realpath($basepath);
        }

        if ($basepath === FALSE) {
            $basepath = NULL;
        } else {
            foreach ($exclude as &$_exclude) {
                $_exclude = str_replace($basepath, '', $_exclude);
            }
        }

        $this->prefixes = $prefixes;
        $this->suffixes = $suffixes;
        $this->exclude  = $exclude;
        $this->basepath = $basepath;

        parent::__construct($iterator);
    }

    /**
     * @return bool
     */
    public function accept()
    {
        $current  = $this->getInnerIterator()->current();
        $filename = $current->getFilename();
        $realpath = $current->getRealPath();

        if ($this->basepath !== NULL) {
            $realpath = str_replace($this->basepath, '', $realpath);
        }

        // Filter files in hidden directories.
        if (preg_match('=/\.[^/]*/=', $realpath)) {
            return FALSE;
        }

        return $this->acceptPath($realpath) &&
               $this->acceptPrefix($filename) &&
               $this->acceptSuffix($filename);
    }

    /**
     * @param  string $path
     * @return bool
     * @since  Method available since Release 1.1.0
     */
    protected function acceptPath($path)
    {
        foreach ($this->exclude as $exclude) {
            if (strpos($path, $exclude) === 0) {
                return FALSE;
            }
        }

        return TRUE;
    }

    /**
     * @param  string $filename
     * @return bool
     * @since  Method available since Release 1.1.0
     */
    protected function acceptPrefix($filename)
    {
        return $this->acceptSubString($filename, $this->prefixes, self::PREFIX);
    }

    /**
     * @param  string $filename
     * @return bool
     * @since  Method available since Release 1.1.0
     */
    protected function acceptSuffix($filename)
    {
        return $this->acceptSubString($filename, $this->suffixes, self::SUFFIX);
    }

    /**
     * @param  string $filename
     * @param  array  $subStrings
     * @param  int    $type
     * @return bool
     * @since  Method available since Release 1.1.0
     */
    protected function acceptSubString($filename, array $subStrings, $type)
    {
        if (empty($subStrings)) {
            return TRUE;
        }

        $matched = FALSE;

        foreach ($subStrings as $string) {
            if (($type == self::PREFIX && strpos($filename, $string) === 0) ||
                ($type == self::SUFFIX &&
                 substr($filename, -1 * strlen($string)) == $string)) {
                $matched = TRUE;
                break;
            }
        }

        return $matched;
    }
}
