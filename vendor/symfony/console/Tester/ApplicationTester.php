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

        $this->initOutput($options);

        $this->statusCode = $this->application->run($this->input, $this->output);

        putenv($shellInteractive ? "SHELL_INTERACTIVE=$shellInteractive" : 'SHELL_INTERACTIVE');

        return $this->statusCode;
    }
}
