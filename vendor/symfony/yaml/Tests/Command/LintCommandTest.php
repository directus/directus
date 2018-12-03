<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Yaml\Tests\Command;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Yaml\Command\LintCommand;

/**
 * Tests the YamlLintCommand.
 *
 * @author Robin Chalas <robin.chalas@gmail.com>
 */
class LintCommandTest extends TestCase
{
    private $files;

    public function testLintCorrectFile()
    {
        $tester = $this->createCommandTester();
        $filename = $this->createFile('foo: bar');

        $ret = $tester->execute(array('filename' => $filename), array('verbosity' => OutputInterface::VERBOSITY_VERBOSE, 'decorated' => false));

        $this->assertEquals(0, $ret, 'Returns 0 in case of success');
        $this->assertRegExp('/^\/\/ OK in /', trim($tester->getDisplay()));
    }

    public function testLintCorrectFiles()
    {
        $tester = $this->createCommandTester();
        $filename1 = $this->createFile('foo: bar');
        $filename2 = $this->createFile('bar: baz');

        $ret = $tester->execute(array('filename' => array($filename1, $filename2)), array('verbosity' => OutputInterface::VERBOSITY_VERBOSE, 'decorated' => false));

        $this->assertEquals(0, $ret, 'Returns 0 in case of success');
        $this->assertRegExp('/^\/\/ OK in /', trim($tester->getDisplay()));
    }

    public function testLintIncorrectFile()
    {
        $incorrectContent = '
foo:
bar';
        $tester = $this->createCommandTester();
        $filename = $this->createFile($incorrectContent);

        $ret = $tester->execute(array('filename' => $filename), array('decorated' => false));

        $this->assertEquals(1, $ret, 'Returns 1 in case of error');
        $this->assertContains('Unable to parse at line 3 (near "bar").', trim($tester->getDisplay()));
    }

    public function testConstantAsKey()
    {
        $yaml = <<<YAML
!php/const 'Symfony\Component\Yaml\Tests\Command\Foo::TEST': bar
YAML;
        $ret = $this->createCommandTester()->execute(array('filename' => $this->createFile($yaml)), array('verbosity' => OutputInterface::VERBOSITY_VERBOSE, 'decorated' => false));
        $this->assertSame(0, $ret, 'lint:yaml exits with code 0 in case of success');
    }

    public function testCustomTags()
    {
        $yaml = <<<YAML
foo: !my_tag {foo: bar}
YAML;
        $ret = $this->createCommandTester()->execute(array('filename' => $this->createFile($yaml), '--parse-tags' => true), array('verbosity' => OutputInterface::VERBOSITY_VERBOSE, 'decorated' => false));
        $this->assertSame(0, $ret, 'lint:yaml exits with code 0 in case of success');
    }

    public function testCustomTagsError()
    {
        $yaml = <<<YAML
foo: !my_tag {foo: bar}
YAML;
        $ret = $this->createCommandTester()->execute(array('filename' => $this->createFile($yaml)), array('verbosity' => OutputInterface::VERBOSITY_VERBOSE, 'decorated' => false));
        $this->assertSame(1, $ret, 'lint:yaml exits with code 1 in case of error');
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testLintFileNotReadable()
    {
        $tester = $this->createCommandTester();
        $filename = $this->createFile('');
        unlink($filename);

        $ret = $tester->execute(array('filename' => $filename), array('decorated' => false));
    }

    /**
     * @return string Path to the new file
     */
    private function createFile($content)
    {
        $filename = tempnam(sys_get_temp_dir().'/framework-yml-lint-test', 'sf-');
        file_put_contents($filename, $content);

        $this->files[] = $filename;

        return $filename;
    }

    /**
     * @return CommandTester
     */
    protected function createCommandTester()
    {
        $application = new Application();
        $application->add(new LintCommand());
        $command = $application->find('lint:yaml');

        return new CommandTester($command);
    }

    protected function setUp()
    {
        $this->files = array();
        @mkdir(sys_get_temp_dir().'/framework-yml-lint-test');
    }

    protected function tearDown()
    {
        foreach ($this->files as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }

        rmdir(sys_get_temp_dir().'/framework-yml-lint-test');
    }
}

class Foo
{
    const TEST = 'foo';
}
