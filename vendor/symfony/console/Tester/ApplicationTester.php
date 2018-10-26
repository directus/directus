<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tester;

use Symfony\Component\Console\Application;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\ConsoleOutput;
use Symfony\Component\Console\Output\StreamOutput;

/**
 * Eases the testing of console applications.
 *
 * When testing an application, don't forget to disable the auto exit flag:
 *
 *     $application = new Application();
 *     $application->setAutoExit(false);
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class ApplicationTester
{
    use TesterTrait;

    private $application;
    private $input;
    private $statusCode;
    private $captureStreamsIndependently = false;

    public function __construct(Application $application)
    {
        $this->application = $application;
    }

    /**
     * Executes the application.
     *
     * Available options:
     *
     *  * interactive:               Sets the input interactive flag
     *  * decorated:                 Sets the output decorated flag
     *  * verbosity:                 Sets the output verbosity flag
     *  * capture_stderr_separately: Make output of stdOut and stdErr separately available
     *
     * @param array $input   An array of arguments and options
     * @param array $options An array of options
     *
     * @return int The command exit code
     */
    public function run(array $input, $options = array())
    {
        $this->input = new ArrayInput($input);
        if (isset($options['interactive'])) {
            $this->input->setInteractive($options['interactive']);
        }

        $shellInteractive = getenv('SHELL_INTERACTIVE');

        if ($this->inputs) {
            $this->input->setStream(self::createStream($this->inputs));
            putenv('SHELL_INTERACTIVE=1');
        }

        $this->captureStreamsIndependently = array_key_exists('capture_stderr_separately', $options) && $options['capture_stderr_separately'];
        if (!$this->captureStreamsIndependently) {
            $this->output = new StreamOutput(fopen('php://memory', 'w', false));
            if (isset($options['decorated'])) {
                $this->output->setDecorated($options['decorated']);
            }
            if (isset($options['verbosity'])) {
                $this->output->setVerbosity($options['verbosity']);
            }
        } else {
            $this->output = new ConsoleOutput(
                isset($options['verbosity']) ? $options['verbosity'] : ConsoleOutput::VERBOSITY_NORMAL,
                isset($options['decorated']) ? $options['decorated'] : null
            );

            $errorOutput = new StreamOutput(fopen('php://memory', 'w', false));
            $errorOutput->setFormatter($this->output->getFormatter());
            $errorOutput->setVerbosity($this->output->getVerbosity());
            $errorOutput->setDecorated($this->output->isDecorated());

            $reflectedOutput = new \ReflectionObject($this->output);
            $strErrProperty = $reflectedOutput->getProperty('stderr');
            $strErrProperty->setAccessible(true);
            $strErrProperty->setValue($this->output, $errorOutput);

            $reflectedParent = $reflectedOutput->getParentClass();
            $streamProperty = $reflectedParent->getProperty('stream');
            $streamProperty->setAccessible(true);
            $streamProperty->setValue($this->output, fopen('php://memory', 'w', false));
        }

        $this->statusCode = $this->application->run($this->input, $this->output);

        putenv($shellInteractive ? "SHELL_INTERACTIVE=$shellInteractive" : 'SHELL_INTERACTIVE');

        return $this->statusCode;
    }

    /**
     * Gets the output written to STDERR by the application.
     *
     * @param bool $normalize Whether to normalize end of lines to \n or not
     *
     * @return string
     */
    public function getErrorOutput($normalize = false)
    {
        if (!$this->captureStreamsIndependently) {
            throw new \LogicException('The error output is not available when the tester is run without "capture_stderr_separately" option set.');
        }

        rewind($this->output->getErrorOutput()->getStream());

        $display = stream_get_contents($this->output->getErrorOutput()->getStream());

        if ($normalize) {
            $display = str_replace(PHP_EOL, "\n", $display);
        }

        return $display;
    }
}
