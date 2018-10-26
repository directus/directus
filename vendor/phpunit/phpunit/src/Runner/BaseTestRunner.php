<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Base class for all test runners.
 */
abstract class PHPUnit_Runner_BaseTestRunner
{
    const STATUS_PASSED     = 0;
    const STATUS_SKIPPED    = 1;
    const STATUS_INCOMPLETE = 2;
    const STATUS_FAILURE    = 3;
    const STATUS_ERROR      = 4;
    const STATUS_RISKY      = 5;
    const STATUS_WARNING    = 6;
    const SUITE_METHODNAME  = 'suite';

    /**
     * Returns the loader to be used.
     *
     * @return PHPUnit_Runner_TestSuiteLoader
     */
    public function getLoader()
    {
        return new PHPUnit_Runner_StandardTestSuiteLoader;
    }

    /**
     * Returns the Test corresponding to the given suite.
     * This is a template method, subclasses override
     * the runFailed() and clearStatus() methods.
     *
     * @param string $suiteClassName
     * @param string $suiteClassFile
     * @param mixed  $suffixes
     *
     * @return PHPUnit_Framework_Test
     */
    public function getTest($suiteClassName, $suiteClassFile = '', $suffixes = '')
    {
        if (is_dir($suiteClassName) &&
            !is_file($suiteClassName . '.php') && empty($suiteClassFile)) {
            $facade = new File_Iterator_Facade;
            $files  = $facade->getFilesAsArray(
                $suiteClassName,
                $suffixes
            );

            $suite = new PHPUnit_Framework_TestSuite($suiteClassName);
            $suite->addTestFiles($files);

            return $suite;
        }

        try {
            $testClass = $this->loadSuiteClass(
                $suiteClassName,
                $suiteClassFile
            );
        } catch (PHPUnit_Framework_Exception $e) {
            $this->runFailed($e->getMessage());

            return;
        }

        try {
            $suiteMethod = $testClass->getMethod(self::SUITE_METHODNAME);

            if (!$suiteMethod->isStatic()) {
                $this->runFailed(
                    'suite() method must be static.'
                );

                return;
            }

            try {
                $test = $suiteMethod->invoke(null, $testClass->getName());
            } catch (ReflectionException $e) {
                $this->runFailed(
                    sprintf(
                        "Failed to invoke suite() method.\n%s",
                        $e->getMessage()
                    )
                );

                return;
            }
        } catch (ReflectionException $e) {
            try {
                $test = new PHPUnit_Framework_TestSuite($testClass);
            } catch (PHPUnit_Framework_Exception $e) {
                $test = new PHPUnit_Framework_TestSuite;
                $test->setName($suiteClassName);
            }
        }

        $this->clearStatus();

        return $test;
    }

    /**
     * Returns the loaded ReflectionClass for a suite name.
     *
     * @param string $suiteClassName
     * @param string $suiteClassFile
     *
     * @return ReflectionClass
     */
    protected function loadSuiteClass($suiteClassName, $suiteClassFile = '')
    {
        $loader = $this->getLoader();

        return $loader->load($suiteClassName, $suiteClassFile);
    }

    /**
     * Clears the status message.
     */
    protected function clearStatus()
    {
    }

    /**
     * Override to define how to handle a failed loading of
     * a test suite.
     *
     * @param string $message
     */
    abstract protected function runFailed($message);
}
