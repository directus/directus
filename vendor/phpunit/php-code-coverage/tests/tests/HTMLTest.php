<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage\Report\Html;

use SebastianBergmann\CodeCoverage\TestCase;

class HTMLTest extends TestCase
{
    private static $TEST_REPORT_PATH_SOURCE;

    public static function setUpBeforeClass()
    {
        parent::setUpBeforeClass();

        self::$TEST_REPORT_PATH_SOURCE = TEST_FILES_PATH . 'Report' . DIRECTORY_SEPARATOR . 'HTML';
    }

    protected function tearDown()
    {
        parent::tearDown();

        $tmpFilesIterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(self::$TEST_TMP_PATH, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($tmpFilesIterator as $path => $fileInfo) {
            /* @var \SplFileInfo $fileInfo */
            $pathname = $fileInfo->getPathname();
            $fileInfo->isDir() ? rmdir($pathname) : unlink($pathname);
        }
    }

    public function testForBankAccountTest()
    {
        $expectedFilesPath = self::$TEST_REPORT_PATH_SOURCE . DIRECTORY_SEPARATOR . 'CoverageForBankAccount';

        $report = new Facade;
        $report->process($this->getCoverageForBankAccount(), self::$TEST_TMP_PATH);

        $this->assertFilesEquals($expectedFilesPath, self::$TEST_TMP_PATH);
    }

    public function testForFileWithIgnoredLines()
    {
        $expectedFilesPath = self::$TEST_REPORT_PATH_SOURCE . DIRECTORY_SEPARATOR . 'CoverageForFileWithIgnoredLines';

        $report = new Facade;
        $report->process($this->getCoverageForFileWithIgnoredLines(), self::$TEST_TMP_PATH);

        $this->assertFilesEquals($expectedFilesPath, self::$TEST_TMP_PATH);
    }

    public function testForClassWithAnonymousFunction()
    {
        $expectedFilesPath =
            self::$TEST_REPORT_PATH_SOURCE . DIRECTORY_SEPARATOR . 'CoverageForClassWithAnonymousFunction';

        $report = new Facade;
        $report->process($this->getCoverageForClassWithAnonymousFunction(), self::$TEST_TMP_PATH);

        $this->assertFilesEquals($expectedFilesPath, self::$TEST_TMP_PATH);
    }

    /**
     * @param string $expectedFilesPath
     * @param string $actualFilesPath
     */
    private function assertFilesEquals($expectedFilesPath, $actualFilesPath)
    {
        $expectedFilesIterator = new \FilesystemIterator($expectedFilesPath);
        $actualFilesIterator   = new \RegexIterator(new \FilesystemIterator($actualFilesPath), '/.html/');

        $this->assertEquals(
            iterator_count($expectedFilesIterator),
            iterator_count($actualFilesIterator),
            'Generated files and expected files not match'
        );

        foreach ($expectedFilesIterator as $path => $fileInfo) {
            /* @var \SplFileInfo $fileInfo */
            $filename = $fileInfo->getFilename();

            $actualFile = $actualFilesPath . DIRECTORY_SEPARATOR . $filename;

            $this->assertFileExists($actualFile);

            $this->assertStringMatchesFormatFile(
                $fileInfo->getPathname(),
                str_replace(PHP_EOL, "\n", file_get_contents($actualFile)),
                "${filename} not match"
            );
        }
    }
}
