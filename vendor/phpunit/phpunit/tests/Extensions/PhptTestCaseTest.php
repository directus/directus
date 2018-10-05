<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Extensions_PhptTestCaseTest extends \PHPUnit_Framework_TestCase
{
    const EXPECT_CONTENT = <<<EOF
--TEST--
EXPECT test
--FILE--
<?php echo "Hello PHPUnit!"; ?>
--EXPECT--
Hello PHPUnit!
EOF;

    const EXPECTF_CONTENT = <<<EOF
--TEST--
EXPECTF test
--FILE--
<?php echo "Hello PHPUnit!"; ?>
--EXPECTF--
Hello %s!
EOF;

    const EXPECTREGEX_CONTENT = <<<EOF
--TEST--
EXPECTREGEX test
--FILE--
<?php echo "Hello PHPUnit!"; ?>
--EXPECTREGEX--
Hello [HPU]{4}[nit]{3}!
EOF;

    const FILE_SECTION = <<<EOF
<?php echo "Hello PHPUnit!"; ?>

EOF;

    protected $filename;
    protected $testCase;
    protected $phpUtil;

    protected function setUp()
    {
        $this->filename = sys_get_temp_dir() . '/phpunit.phpt';
        touch($this->filename);

        $this->phpUtil = $this->getMockForAbstractClass('PHPUnit_Util_PHP', [], '', false);

        $this->testCase = new PHPUnit_Extensions_PhptTestCase($this->filename, $this->phpUtil);
    }

    protected function tearDown()
    {
        @unlink($this->filename);

        $this->filename = null;
        $this->testCase = null;
    }

    /**
     * Defines the content of the current PHPT test.
     *
     * @param string $content
     */
    private function setPhpContent($content)
    {
        file_put_contents($this->filename, $content);
    }

    public function testShouldRunFileSectionAsTest()
    {
        $this->setPhpContent(self::EXPECT_CONTENT);

        $fileSection = '<?php echo "Hello PHPUnit!"; ?>' . PHP_EOL;

        $this->phpUtil
            ->expects($this->once())
            ->method('runJob')
            ->with($fileSection)
            ->will($this->returnValue(['stdout' => '', 'stderr' => '']));

        $this->testCase->run();
    }

    public function testShouldRunSkipifSectionWhenExists()
    {
        $skipifSection = '<?php /** Nothing **/ ?>' . PHP_EOL;

        $phptContent = self::EXPECT_CONTENT . PHP_EOL;
        $phptContent .= '--SKIPIF--' . PHP_EOL;
        $phptContent .= $skipifSection;

        $this->setPhpContent($phptContent);

        $this->phpUtil
            ->expects($this->at(0))
            ->method('runJob')
            ->with($skipifSection)
            ->will($this->returnValue(['stdout' => '', 'stderr' => '']));

        $this->testCase->run();
    }

    public function testShouldNotRunTestSectionIfSkipifSectionReturnsOutputWithSkipWord()
    {
        $skipifSection = '<?php echo "skip: Reason"; ?>' . PHP_EOL;

        $phptContent = self::EXPECT_CONTENT . PHP_EOL;
        $phptContent .= '--SKIPIF--' . PHP_EOL;
        $phptContent .= $skipifSection;

        $this->setPhpContent($phptContent);

        $this->phpUtil
            ->expects($this->once())
            ->method('runJob')
            ->with($skipifSection)
            ->will($this->returnValue(['stdout' => 'skip: Reason', 'stderr' => '']));

        $this->testCase->run();
    }

    public function testShouldRunCleanSectionWhenDefined()
    {
        $cleanSection = '<?php unlink("/tmp/something"); ?>' . PHP_EOL;

        $phptContent = self::EXPECT_CONTENT . PHP_EOL;
        $phptContent .= '--CLEAN--' . PHP_EOL;
        $phptContent .= $cleanSection;

        $this->setPhpContent($phptContent);

        $this->phpUtil
            ->expects($this->at(1))
            ->method('runJob')
            ->with($cleanSection);

        $this->testCase->run();
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     * @expectedExceptionMessage Invalid PHPT file
     */
    public function testShouldThrowsAnExceptionWhenPhptFileIsEmpty()
    {
        $this->setPhpContent('');

        $this->testCase->run();
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     * @expectedExceptionMessage Invalid PHPT file
     */
    public function testShouldThrowsAnExceptionWhenFileSectionIsMissing()
    {
        $this->setPhpContent(
            <<<EOF
--TEST--
Something to decribe it
--EXPECT--
Something
EOF
        );
        $this->testCase->run();
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     * @expectedExceptionMessage Invalid PHPT file
     */
    public function testShouldThrowsAnExceptionWhenThereIsNoExpecOrExpectifOrExpecregexSectionInPhptFile()
    {
        $this->setPhpContent(
            <<<EOF
--TEST--
Something to decribe it
--FILE--
<?php
echo "Hello world!\n";
?>
EOF
        );
        $this->testCase->run();
    }

    public function testShouldValidateExpectSession()
    {
        $this->setPhpContent(self::EXPECT_CONTENT);

        $this->phpUtil
            ->expects($this->once())
            ->method('runJob')
            ->with(self::FILE_SECTION)
            ->will($this->returnValue(['stdout' => 'Hello PHPUnit!', 'stderr' => '']));

        $result = $this->testCase->run();

        $this->assertTrue($result->wasSuccessful());
    }

    public function testShouldValidateExpectfSession()
    {
        $this->setPhpContent(self::EXPECTF_CONTENT);

        $this->phpUtil
            ->expects($this->once())
            ->method('runJob')
            ->with(self::FILE_SECTION)
            ->will($this->returnValue(['stdout' => 'Hello PHPUnit!', 'stderr' => '']));

        $result = $this->testCase->run();

        $this->assertTrue($result->wasSuccessful());
    }

    public function testShouldValidateExpectregexSession()
    {
        $this->setPhpContent(self::EXPECTREGEX_CONTENT);

        $this->phpUtil
            ->expects($this->once())
            ->method('runJob')
            ->with(self::FILE_SECTION)
            ->will($this->returnValue(['stdout' => 'Hello PHPUnit!', 'stderr' => '']));

        $result = $this->testCase->run();

        $this->assertTrue($result->wasSuccessful());
    }

    public function testParseIniSection()
    {
        $phptTestCase = new PhpTestCaseProxy(__FILE__);
        $settings     = $phptTestCase->parseIniSection("foo=1\nbar = 2\rbaz = 3\r\nempty=\nignore");

        $expected = [
            'foo=1',
            'bar = 2',
            'baz = 3',
            'empty=',
            'ignore',
        ];

        $this->assertEquals($expected, $settings);
    }
}

class PhpTestCaseProxy extends PHPUnit_Extensions_PhptTestCase
{
    public function parseIniSection($content)
    {
        return parent::parseIniSection($content);
    }
}
