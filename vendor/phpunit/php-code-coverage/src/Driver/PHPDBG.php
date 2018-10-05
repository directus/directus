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
 * Driver for PHPDBG's code coverage functionality.
 *
 * @codeCoverageIgnore
 */
class PHPDBG implements Driver
{
    /**
     * Constructor.
     */
    public function __construct()
    {
        if (PHP_SAPI !== 'phpdbg') {
            throw new RuntimeException(
                'This driver requires the PHPDBG SAPI'
            );
        }

        if (!function_exists('phpdbg_start_oplog')) {
            throw new RuntimeException(
                'This build of PHPDBG does not support code coverage'
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
        phpdbg_start_oplog();
    }

    /**
     * Stop collection of code coverage information.
     *
     * @return array
     */
    public function stop()
    {
        static $fetchedLines = [];

        $dbgData = phpdbg_end_oplog();

        if ($fetchedLines == []) {
            $sourceLines = phpdbg_get_executable();
        } else {
            $newFiles = array_diff(
                get_included_files(),
                array_keys($fetchedLines)
            );

            if ($newFiles) {
                $sourceLines = phpdbg_get_executable(
                    ['files' => $newFiles]
                );
            } else {
                $sourceLines = [];
            }
        }

        foreach ($sourceLines as $file => $lines) {
            foreach ($lines as $lineNo => $numExecuted) {
                $sourceLines[$file][$lineNo] = self::LINE_NOT_EXECUTED;
            }
        }

        $fetchedLines = array_merge($fetchedLines, $sourceLines);

        return $this->detectExecutedLines($fetchedLines, $dbgData);
    }

    /**
     * Convert phpdbg based data into the format CodeCoverage expects
     *
     * @param array $sourceLines
     * @param array $dbgData
     *
     * @return array
     */
    private function detectExecutedLines(array $sourceLines, array $dbgData)
    {
        foreach ($dbgData as $file => $coveredLines) {
            foreach ($coveredLines as $lineNo => $numExecuted) {
                // phpdbg also reports $lineNo=0 when e.g. exceptions get thrown.
                // make sure we only mark lines executed which are actually executable.
                if (isset($sourceLines[$file][$lineNo])) {
                    $sourceLines[$file][$lineNo] = self::LINE_EXECUTED;
                }
            }
        }

        return $sourceLines;
    }
}
