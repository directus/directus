<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Utility class for code filtering.
 */
class PHPUnit_Util_Filter
{
    /**
     * Filters stack frames from PHPUnit classes.
     *
     * @param Exception $e
     * @param bool      $asString
     *
     * @return string
     */
    public static function getFilteredStacktrace($e, $asString = true)
    {
        $prefix = false;
        $script = realpath($GLOBALS['_SERVER']['SCRIPT_NAME']);

        if (defined('__PHPUNIT_PHAR_ROOT__')) {
            $prefix = __PHPUNIT_PHAR_ROOT__;
        }

        if ($asString === true) {
            $filteredStacktrace = '';
        } else {
            $filteredStacktrace = [];
        }

        if ($e instanceof PHPUnit_Framework_SyntheticError) {
            $eTrace = $e->getSyntheticTrace();
            $eFile  = $e->getSyntheticFile();
            $eLine  = $e->getSyntheticLine();
        } elseif ($e instanceof PHPUnit_Framework_Exception) {
            $eTrace = $e->getSerializableTrace();
            $eFile  = $e->getFile();
            $eLine  = $e->getLine();
        } else {
            if ($e->getPrevious()) {
                $e = $e->getPrevious();
            }
            $eTrace = $e->getTrace();
            $eFile  = $e->getFile();
            $eLine  = $e->getLine();
        }

        if (!self::frameExists($eTrace, $eFile, $eLine)) {
            array_unshift(
                $eTrace,
                ['file' => $eFile, 'line' => $eLine]
            );
        }

        $blacklist = new PHPUnit_Util_Blacklist;

        foreach ($eTrace as $frame) {
            if (isset($frame['file']) && is_file($frame['file']) &&
                !$blacklist->isBlacklisted($frame['file']) &&
                ($prefix === false || strpos($frame['file'], $prefix) !== 0) &&
                $frame['file'] !== $script) {
                if ($asString === true) {
                    $filteredStacktrace .= sprintf(
                        "%s:%s\n",
                        $frame['file'],
                        isset($frame['line']) ? $frame['line'] : '?'
                    );
                } else {
                    $filteredStacktrace[] = $frame;
                }
            }
        }

        return $filteredStacktrace;
    }

    /**
     * @param array  $trace
     * @param string $file
     * @param int    $line
     *
     * @return bool
     */
    private static function frameExists(array $trace, $file, $line)
    {
        foreach ($trace as $frame) {
            if (isset($frame['file']) && $frame['file'] == $file &&
                isset($frame['line']) && $frame['line'] == $line) {
                return true;
            }
        }

        return false;
    }
}
