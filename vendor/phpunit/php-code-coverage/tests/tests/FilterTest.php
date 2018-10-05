<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage;

class FilterTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Filter
     */
    private $filter;

    /**
     * @var array
     */
    private $files = [];

    protected function setUp()
    {
        $this->filter = unserialize('O:37:"SebastianBergmann\CodeCoverage\Filter":0:{}');

        $this->files = [
            TEST_FILES_PATH . 'BankAccount.php',
            TEST_FILES_PATH . 'BankAccountTest.php',
            TEST_FILES_PATH . 'CoverageClassExtendedTest.php',
            TEST_FILES_PATH . 'CoverageClassTest.php',
            TEST_FILES_PATH . 'CoverageFunctionParenthesesTest.php',
            TEST_FILES_PATH . 'CoverageFunctionParenthesesWhitespaceTest.php',
            TEST_FILES_PATH . 'CoverageFunctionTest.php',
            TEST_FILES_PATH . 'CoverageMethodOneLineAnnotationTest.php',
            TEST_FILES_PATH . 'CoverageMethodParenthesesTest.php',
            TEST_FILES_PATH . 'CoverageMethodParenthesesWhitespaceTest.php',
            TEST_FILES_PATH . 'CoverageMethodTest.php',
            TEST_FILES_PATH . 'CoverageNoneTest.php',
            TEST_FILES_PATH . 'CoverageNotPrivateTest.php',
            TEST_FILES_PATH . 'CoverageNotProtectedTest.php',
            TEST_FILES_PATH . 'CoverageNotPublicTest.php',
            TEST_FILES_PATH . 'CoverageNothingTest.php',
            TEST_FILES_PATH . 'CoveragePrivateTest.php',
            TEST_FILES_PATH . 'CoverageProtectedTest.php',
            TEST_FILES_PATH . 'CoveragePublicTest.php',
            TEST_FILES_PATH . 'CoverageTwoDefaultClassAnnotations.php',
            TEST_FILES_PATH . 'CoveredClass.php',
            TEST_FILES_PATH . 'CoveredFunction.php',
            TEST_FILES_PATH . 'NamespaceCoverageClassExtendedTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageClassTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageCoversClassPublicTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageCoversClassTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageMethodTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageNotPrivateTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageNotProtectedTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageNotPublicTest.php',
            TEST_FILES_PATH . 'NamespaceCoveragePrivateTest.php',
            TEST_FILES_PATH . 'NamespaceCoverageProtectedTest.php',
            TEST_FILES_PATH . 'NamespaceCoveragePublicTest.php',
            TEST_FILES_PATH . 'NamespaceCoveredClass.php',
            TEST_FILES_PATH . 'NotExistingCoveredElementTest.php',
            TEST_FILES_PATH . 'source_with_class_and_anonymous_function.php',
            TEST_FILES_PATH . 'source_with_ignore.php',
            TEST_FILES_PATH . 'source_with_namespace.php',
            TEST_FILES_PATH . 'source_with_oneline_annotations.php',
            TEST_FILES_PATH . 'source_without_ignore.php',
            TEST_FILES_PATH . 'source_without_namespace.php'
        ];
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::addFileToWhitelist
     * @covers SebastianBergmann\CodeCoverage\Filter::getWhitelist
     */
    public function testAddingAFileToTheWhitelistWorks()
    {
        $this->filter->addFileToWhitelist($this->files[0]);

        $this->assertEquals(
            [$this->files[0]],
            $this->filter->getWhitelist()
        );
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::removeFileFromWhitelist
     * @covers SebastianBergmann\CodeCoverage\Filter::getWhitelist
     */
    public function testRemovingAFileFromTheWhitelistWorks()
    {
        $this->filter->addFileToWhitelist($this->files[0]);
        $this->filter->removeFileFromWhitelist($this->files[0]);

        $this->assertEquals([], $this->filter->getWhitelist());
    }

    /**
     * @covers  SebastianBergmann\CodeCoverage\Filter::addDirectoryToWhitelist
     * @covers  SebastianBergmann\CodeCoverage\Filter::getWhitelist
     * @depends testAddingAFileToTheWhitelistWorks
     */
    public function testAddingADirectoryToTheWhitelistWorks()
    {
        $this->filter->addDirectoryToWhitelist(TEST_FILES_PATH);

        $whitelist = $this->filter->getWhitelist();
        sort($whitelist);

        $this->assertEquals($this->files, $whitelist);
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::addFilesToWhitelist
     * @covers SebastianBergmann\CodeCoverage\Filter::getWhitelist
     */
    public function testAddingFilesToTheWhitelistWorks()
    {
        $facade = new \File_Iterator_Facade;

        $files = $facade->getFilesAsArray(
            TEST_FILES_PATH,
            $suffixes = '.php'
        );

        $this->filter->addFilesToWhitelist($files);

        $whitelist = $this->filter->getWhitelist();
        sort($whitelist);

        $this->assertEquals($this->files, $whitelist);
    }

    /**
     * @covers  SebastianBergmann\CodeCoverage\Filter::removeDirectoryFromWhitelist
     * @covers  SebastianBergmann\CodeCoverage\Filter::getWhitelist
     * @depends testAddingADirectoryToTheWhitelistWorks
     */
    public function testRemovingADirectoryFromTheWhitelistWorks()
    {
        $this->filter->addDirectoryToWhitelist(TEST_FILES_PATH);
        $this->filter->removeDirectoryFromWhitelist(TEST_FILES_PATH);

        $this->assertEquals([], $this->filter->getWhitelist());
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::isFile
     */
    public function testIsFile()
    {
        $this->assertFalse($this->filter->isFile('vfs://root/a/path'));
        $this->assertFalse($this->filter->isFile('xdebug://debug-eval'));
        $this->assertFalse($this->filter->isFile('eval()\'d code'));
        $this->assertFalse($this->filter->isFile('runtime-created function'));
        $this->assertFalse($this->filter->isFile('assert code'));
        $this->assertFalse($this->filter->isFile('regexp code'));
        $this->assertTrue($this->filter->isFile(__FILE__));
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::isFiltered
     */
    public function testWhitelistedFileIsNotFiltered()
    {
        $this->filter->addFileToWhitelist($this->files[0]);
        $this->assertFalse($this->filter->isFiltered($this->files[0]));
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::isFiltered
     */
    public function testNotWhitelistedFileIsFiltered()
    {
        $this->filter->addFileToWhitelist($this->files[0]);
        $this->assertTrue($this->filter->isFiltered($this->files[1]));
    }

    /**
     * @covers SebastianBergmann\CodeCoverage\Filter::isFiltered
     * @covers SebastianBergmann\CodeCoverage\Filter::isFile
     */
    public function testNonFilesAreFiltered()
    {
        $this->assertTrue($this->filter->isFiltered('vfs://root/a/path'));
        $this->assertTrue($this->filter->isFiltered('xdebug://debug-eval'));
        $this->assertTrue($this->filter->isFiltered('eval()\'d code'));
        $this->assertTrue($this->filter->isFiltered('runtime-created function'));
        $this->assertTrue($this->filter->isFiltered('assert code'));
        $this->assertTrue($this->filter->isFiltered('regexp code'));
    }
}
