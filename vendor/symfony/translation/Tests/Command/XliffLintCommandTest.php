<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\Command;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Translation\Command\XliffLintCommand;

/**
 * Tests the XliffLintCommand.
 *
 * @author Javier Eguiluz <javier.eguiluz@gmail.com>
 */
class XliffLintCommandTest extends TestCase
{
    private $files;

    public function testLintCorrectFile()
    {
        $tester = $this->createCommandTester();
        $filename = $this->createFile();

        $tester->execute(
            array('filename' => $filename),
            array('verbosity' => OutputInterface::VERBOSITY_VERBOSE, 'decorated' => false)
        );

        $this->assertEquals(0, $tester->getStatusCode(), 'Returns 0 in case of success');
        $this->assertContains('OK', trim($tester->getDisplay()));
    }

    public function testLintIncorrectXmlSyntax()
    {
        $tester = $this->createCommandTester();
        $filename = $this->createFile('note <target>');

        $tester->execute(array('filename' => $filename), array('decorated' => false));

        $this->assertEquals(1, $tester->getStatusCode(), 'Returns 1 in case of error');
        $this->assertContains('Opening and ending tag mismatch: target line 6 and source', trim($tester->getDisplay()));
    }

    public function testLintIncorrectTargetLanguage()
    {
        $tester = $this->createCommandTester();
        $filename = $this->createFile('note', 'es');

        $tester->execute(array('filename' => $filename), array('decorated' => false));

        $this->assertEquals(1, $tester->getStatusCode(), 'Returns 1 in case of error');
        $this->assertContains('There is a mismatch between the file extension ("en.xlf") and the "es" value used in the "target-language" attribute of the file.', trim($tester->getDisplay()));
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testLintFileNotReadable()
    {
        $tester = $this->createCommandTester();
        $filename = $this->createFile();
        unlink($filename);

        $tester->execute(array('filename' => $filename), array('decorated' => false));
    }

    public function testGetHelp()
    {
        $command = new XliffLintCommand();
        $expected = <<<EOF
The <info>%command.name%</info> command lints a XLIFF file and outputs to STDOUT
the first encountered syntax error.

You can validates XLIFF contents passed from STDIN:

  <info>cat filename | php %command.full_name%</info>

You can also validate the syntax of a file:

  <info>php %command.full_name% filename</info>

Or of a whole directory:

  <info>php %command.full_name% dirname</info>
  <info>php %command.full_name% dirname --format=json</info>

EOF;

        $this->assertEquals($expected, $command->getHelp());
    }

    /**
     * @return string Path to the new file
     */
    private function createFile($sourceContent = 'note', $targetLanguage = 'en')
    {
        $xliffContent = <<<XLIFF
<?xml version="1.0"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file source-language="en" target-language="$targetLanguage" datatype="plaintext" original="file.ext">
        <body>
            <trans-unit id="note">
                <source>$sourceContent</source>
                <target>NOTE</target>
            </trans-unit>
        </body>
    </file>
</xliff>
XLIFF;

        $filename = sprintf('%s/translation-xliff-lint-test/messages.en.xlf', sys_get_temp_dir());
        file_put_contents($filename, $xliffContent);

        $this->files[] = $filename;

        return $filename;
    }

    /**
     * @return CommandTester
     */
    private function createCommandTester($application = null)
    {
        if (!$application) {
            $application = new Application();
            $application->add(new XliffLintCommand());
        }

        $command = $application->find('lint:xliff');

        if ($application) {
            $command->setApplication($application);
        }

        return new CommandTester($command);
    }

    protected function setUp()
    {
        $this->files = array();
        @mkdir(sys_get_temp_dir().'/translation-xliff-lint-test');
    }

    protected function tearDown()
    {
        foreach ($this->files as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
        rmdir(sys_get_temp_dir().'/translation-xliff-lint-test');
    }
}
