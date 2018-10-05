<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage\Driver;

use SebastianBergmann\CodeCoverage\RuntimeException;

/**
 * Driver for Xdebug's code coverage functionality.
 *
 * @codeCoverageIgnore
 */
class Xdebug implements Driver
{
    /**
     * Cache the number of lines for each file
     *
     * @var array
     */
    private $cacheNumLines = [];

    /**
     * Constructor.
     */
    public function __construct()
    {
        if (!extension_loaded('xdebug')) {
            throw new RuntimeException('This driver requires Xdebug');
        }

        if (version_compare(phpversion('xdebug'), '2.2.1', '>=') &&
            !ini_get('xdebug.coverage_enable')) {
            throw new RuntimeException(
                'xdebug.coverage_enable=On has to be set in php.ini'
            );
        }
    }

    /**
     * Start collection of code coverage information.
     *
     * @param bool $determineUnusedAndDead
     */
    public function start($determineUnusedAndDead = true)
    {
        if ($determineUnusedAndDead) {
            xdebug_start_code_coverage(XDEBUG_CC_UNUSED | XDEBUG_CC_DEAD_CODE);
        } else {
            xdebug_start_code_coverage();
        }
    }

    /**
     * Stop collection of code coverage information.
     *
     * @return array
     */
    public function stop()
    {
        $data = xdebug_get_code_coverage();
        xdebug_stop_code_coverage();

        return $this->cleanup($data);
    }

    /**
     * @param array $data
     *
     * @return array
     */
    private function cleanup(array $data)
    {
        foreach (array_keys($data) as $file) {
            unset($data[$file][0]);

            if (strpos($file, 'xdebug://debug-eval') !== 0 && file_exists($file)) {
                $numLines = $this->getNumberOfLinesInFile($file);

                foreach (array_keys($data[$file]) as $line) {
                    if ($line > $numLines) {
                        unset($data[$file][$line]);
                    }
                }
            }
        }

        return $data;
    }

    /**
     * @param string $file
     *
     * @return int
     */
    private function getNumberOfLinesInFile($file)
    {
        if (!isset($this->cacheNumLines[$file])) {
            $buffer = file_get_contents($file);
            $lines  = substr_count($buffer, "\n");

            if (substr($buffer, -1) !== "\n") {
                $lines++;
            }

            $this->cacheNumLines[$file] = $lines;
        }

        return $this->cacheNumLines[$file];
    }
}
