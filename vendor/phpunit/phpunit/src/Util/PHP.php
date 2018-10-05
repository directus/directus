<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use SebastianBergmann\Environment\Runtime;

/**
 * Utility methods for PHP sub-processes.
 */
abstract class PHPUnit_Util_PHP
{
    /**
     * @var Runtime
     */
    protected $runtime;

    /**
     * @var bool
     */
    protected $stderrRedirection = false;

    /**
     * @var string
     */
    protected $stdin = '';

    /**
     * @var string
     */
    protected $args = '';

    /**
     * @var array
     */
    protected $env = [];

    /**
     * @var int
     */
    protected $timeout = 0;

    /**
     * Creates internal Runtime instance.
     */
    public function __construct()
    {
        $this->runtime = new Runtime();
    }

    /**
     * Defines if should use STDERR redirection or not.
     *
     * Then $stderrRedirection is TRUE, STDERR is redirected to STDOUT.
     *
     * @throws PHPUnit_Framework_Exception
     *
     * @param bool $stderrRedirection
     */
    public function setUseStderrRedirection($stderrRedirection)
    {
        if (!is_bool($stderrRedirection)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(1, 'boolean');
        }

        $this->stderrRedirection = $stderrRedirection;
    }

    /**
     * Returns TRUE if uses STDERR redirection or FALSE if not.
     *
     * @return bool
     */
    public function useStderrRedirection()
    {
        return $this->stderrRedirection;
    }

    /**
     * Sets the input string to be sent via STDIN
     *
     * @param string $stdin
     */
    public function setStdin($stdin)
    {
        $this->stdin = (string) $stdin;
    }

    /**
     * Returns the input string to be sent via STDIN
     *
     * @return string
     */
    public function getStdin()
    {
        return $this->stdin;
    }

    /**
     * Sets the string of arguments to pass to the php job
     *
     * @param string $args
     */
    public function setArgs($args)
    {
        $this->args = (string) $args;
    }

    /**
     * Returns the string of arguments to pass to the php job
     *
     * @retrun string
     */
    public function getArgs()
    {
        return $this->args;
    }

    /**
     * Sets the array of environment variables to start the child process with
     *
     * @param array $env
     */
    public function setEnv(array $env)
    {
        $this->env = $env;
    }

    /**
     * Returns the array of environment variables to start the child process with
     *
     * @return array
     */
    public function getEnv()
    {
        return $this->env;
    }

    /**
     * Sets the amount of seconds to wait before timing out
     *
     * @param int $timeout
     */
    public function setTimeout($timeout)
    {
        $this->timeout = (int) $timeout;
    }

    /**
     * Returns the amount of seconds to wait before timing out
     *
     * @return int
     */
    public function getTimeout()
    {
        return $this->timeout;
    }

    /**
     * @return PHPUnit_Util_PHP
     */
    public static function factory()
    {
        if (DIRECTORY_SEPARATOR == '\\') {
            return new PHPUnit_Util_PHP_Windows;
        }

        return new PHPUnit_Util_PHP_Default;
    }

    /**
     * Runs a single test in a separate PHP process.
     *
     * @param string                       $job
     * @param PHPUnit_Framework_Test       $test
     * @param PHPUnit_Framework_TestResult $result
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function runTestJob($job, PHPUnit_Framework_Test $test, PHPUnit_Framework_TestResult $result)
    {
        $result->startTest($test);

        $_result = $this->runJob($job);

        $this->processChildResult(
            $test,
            $result,
            $_result['stdout'],
            $_result['stderr']
        );
    }

    /**
     * Returns the command based into the configurations.
     *
     * @param array       $settings
     * @param string|null $file
     *
     * @return string
     */
    public function getCommand(array $settings, $file = null)
    {
        $command = $this->runtime->getBinary();
        $command .= $this->settingsToParameters($settings);

        if ('phpdbg' === PHP_SAPI) {
            $command .= ' -qrr ';

            if ($file) {
                $command .= '-e ' . escapeshellarg($file);
            } else {
                $command .= escapeshellarg(__DIR__ . '/PHP/eval-stdin.php');
            }
        } elseif ($file) {
            $command .= ' -f ' . escapeshellarg($file);
        }

        if ($this->args) {
            $command .= ' -- ' . $this->args;
        }

        if (true === $this->stderrRedirection) {
            $command .= ' 2>&1';
        }

        return $command;
    }

    /**
     * Runs a single job (PHP code) using a separate PHP process.
     *
     * @param string $job
     * @param array  $settings
     *
     * @return array
     *
     * @throws PHPUnit_Framework_Exception
     */
    abstract public function runJob($job, array $settings = []);

    /**
     * @param array $settings
     *
     * @return string
     */
    protected function settingsToParameters(array $settings)
    {
        $buffer = '';

        foreach ($settings as $setting) {
            $buffer .= ' -d ' . $setting;
        }

        return $buffer;
    }

    /**
     * Processes the TestResult object from an isolated process.
     *
     * @param PHPUnit_Framework_Test       $test
     * @param PHPUnit_Framework_TestResult $result
     * @param string                       $stdout
     * @param string                       $stderr
     */
    private function processChildResult(PHPUnit_Framework_Test $test, PHPUnit_Framework_TestResult $result, $stdout, $stderr)
    {
        $time = 0;

        if (!empty($stderr)) {
            $result->addError(
                $test,
                new PHPUnit_Framework_Exception(trim($stderr)),
                $time
            );
        } else {
            set_error_handler(function ($errno, $errstr, $errfile, $errline) {
                throw new ErrorException($errstr, $errno, $errno, $errfile, $errline);
            });
            try {
                if (strpos($stdout, "#!/usr/bin/env php\n") === 0) {
                    $stdout = substr($stdout, 19);
                }

                $childResult = unserialize(str_replace("#!/usr/bin/env php\n", '', $stdout));
                restore_error_handler();
            } catch (ErrorException $e) {
                restore_error_handler();
                $childResult = false;

                $result->addError(
                    $test,
                    new PHPUnit_Framework_Exception(trim($stdout), 0, $e),
                    $time
                );
            }

            if ($childResult !== false) {
                if (!empty($childResult['output'])) {
                    $output = $childResult['output'];
                }

                $test->setResult($childResult['testResult']);
                $test->addToAssertionCount($childResult['numAssertions']);

                $childResult = $childResult['result'];
                /* @var $childResult PHPUnit_Framework_TestResult */

                if ($result->getCollectCodeCoverageInformation()) {
                    $result->getCodeCoverage()->merge(
                        $childResult->getCodeCoverage()
                    );
                }

                $time           = $childResult->time();
                $notImplemented = $childResult->notImplemented();
                $risky          = $childResult->risky();
                $skipped        = $childResult->skipped();
                $errors         = $childResult->errors();
                $warnings       = $childResult->warnings();
                $failures       = $childResult->failures();

                if (!empty($notImplemented)) {
                    $result->addError(
                        $test,
                        $this->getException($notImplemented[0]),
                        $time
                    );
                } elseif (!empty($risky)) {
                    $result->addError(
                        $test,
                        $this->getException($risky[0]),
                        $time
                    );
                } elseif (!empty($skipped)) {
                    $result->addError(
                        $test,
                        $this->getException($skipped[0]),
                        $time
                    );
                } elseif (!empty($errors)) {
                    $result->addError(
                        $test,
                        $this->getException($errors[0]),
                        $time
                    );
                } elseif (!empty($warnings)) {
                    $result->addWarning(
                        $test,
                        $this->getException($warnings[0]),
                        $time
                    );
                } elseif (!empty($failures)) {
                    $result->addFailure(
                        $test,
                        $this->getException($failures[0]),
                        $time
                    );
                }
            }
        }

        $result->endTest($test, $time);

        if (!empty($output)) {
            print $output;
        }
    }

    /**
     * Gets the thrown exception from a PHPUnit_Framework_TestFailure.
     *
     * @param PHPUnit_Framework_TestFailure $error
     *
     * @return Exception
     *
     * @see    https://github.com/sebastianbergmann/phpunit/issues/74
     */
    private function getException(PHPUnit_Framework_TestFailure $error)
    {
        $exception = $error->thrownException();

        if ($exception instanceof __PHP_Incomplete_Class) {
            $exceptionArray = [];
            foreach ((array) $exception as $key => $value) {
                $key                  = substr($key, strrpos($key, "\0") + 1);
                $exceptionArray[$key] = $value;
            }

            $exception = new PHPUnit_Framework_SyntheticError(
                sprintf(
                    '%s: %s',
                    $exceptionArray['_PHP_Incomplete_Class_Name'],
                    $exceptionArray['message']
                ),
                $exceptionArray['code'],
                $exceptionArray['file'],
                $exceptionArray['line'],
                $exceptionArray['trace']
            );
        }

        return $exception;
    }
}
