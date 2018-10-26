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
 * A TestSuite is a composite of Tests. It runs a collection of test cases.
 */
class PHPUnit_Framework_TestSuite implements PHPUnit_Framework_Test, PHPUnit_Framework_SelfDescribing, IteratorAggregate
{
    /**
     * Last count of tests in this suite.
     *
     * @var int|null
     */
    private $cachedNumTests;

    /**
     * Enable or disable the backup and restoration of the $GLOBALS array.
     *
     * @var bool
     */
    protected $backupGlobals = null;

    /**
     * Enable or disable the backup and restoration of static attributes.
     *
     * @var bool
     */
    protected $backupStaticAttributes = null;

    /**
     * @var bool
     */
    private $beStrictAboutChangesToGlobalState = null;

    /**
     * @var bool
     */
    protected $runTestInSeparateProcess = false;

    /**
     * The name of the test suite.
     *
     * @var string
     */
    protected $name = '';

    /**
     * The test groups of the test suite.
     *
     * @var array
     */
    protected $groups = [];

    /**
     * The tests in the test suite.
     *
     * @var array
     */
    protected $tests = [];

    /**
     * The number of tests in the test suite.
     *
     * @var int
     */
    protected $numTests = -1;

    /**
     * @var bool
     */
    protected $testCase = false;

    /**
     * @var array
     */
    protected $foundClasses = [];

    /**
     * @var PHPUnit_Runner_Filter_Factory
     */
    private $iteratorFilter = null;

    /**
     * @var string[]
     */
    private $declaredClasses;

    /**
     * Constructs a new TestSuite:
     *
     *   - PHPUnit_Framework_TestSuite() constructs an empty TestSuite.
     *
     *   - PHPUnit_Framework_TestSuite(ReflectionClass) constructs a
     *     TestSuite from the given class.
     *
     *   - PHPUnit_Framework_TestSuite(ReflectionClass, String)
     *     constructs a TestSuite from the given class with the given
     *     name.
     *
     *   - PHPUnit_Framework_TestSuite(String) either constructs a
     *     TestSuite from the given class (if the passed string is the
     *     name of an existing class) or constructs an empty TestSuite
     *     with the given name.
     *
     * @param mixed  $theClass
     * @param string $name
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function __construct($theClass = '', $name = '')
    {
        $this->declaredClasses = get_declared_classes();

        $argumentsValid = false;

        if (is_object($theClass) &&
            $theClass instanceof ReflectionClass) {
            $argumentsValid = true;
        } elseif (is_string($theClass) &&
                 $theClass !== '' &&
                 class_exists($theClass, false)) {
            $argumentsValid = true;

            if ($name == '') {
                $name = $theClass;
            }

            $theClass = new ReflectionClass($theClass);
        } elseif (is_string($theClass)) {
            $this->setName($theClass);

            return;
        }

        if (!$argumentsValid) {
            throw new PHPUnit_Framework_Exception;
        }

        if (!$theClass->isSubclassOf('PHPUnit_Framework_TestCase')) {
            throw new PHPUnit_Framework_Exception(
                'Class "' . $theClass->name . '" does not extend PHPUnit_Framework_TestCase.'
            );
        }

        if ($name != '') {
            $this->setName($name);
        } else {
            $this->setName($theClass->getName());
        }

        $constructor = $theClass->getConstructor();

        if ($constructor !== null &&
            !$constructor->isPublic()) {
            $this->addTest(
                self::warning(
                    sprintf(
                        'Class "%s" has no public constructor.',
                        $theClass->getName()
                    )
                )
            );

            return;
        }

        foreach ($theClass->getMethods() as $method) {
            $this->addTestMethod($theClass, $method);
        }

        if (empty($this->tests)) {
            $this->addTest(
                self::warning(
                    sprintf(
                        'No tests found in class "%s".',
                        $theClass->getName()
                    )
                )
            );
        }

        $this->testCase = true;
    }

    /**
     * Returns a string representation of the test suite.
     *
     * @return string
     */
    public function toString()
    {
        return $this->getName();
    }

    /**
     * Adds a test to the suite.
     *
     * @param PHPUnit_Framework_Test $test
     * @param array                  $groups
     */
    public function addTest(PHPUnit_Framework_Test $test, $groups = [])
    {
        $class = new ReflectionClass($test);

        if (!$class->isAbstract()) {
            $this->tests[]  = $test;
            $this->numTests = -1;

            if ($test instanceof self &&
                empty($groups)) {
                $groups = $test->getGroups();
            }

            if (empty($groups)) {
                $groups = ['default'];
            }

            foreach ($groups as $group) {
                if (!isset($this->groups[$group])) {
                    $this->groups[$group] = [$test];
                } else {
                    $this->groups[$group][] = $test;
                }
            }

            if ($test instanceof PHPUnit_Framework_TestCase) {
                $test->setGroups($groups);
            }
        }
    }

    /**
     * Adds the tests from the given class to the suite.
     *
     * @param mixed $testClass
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function addTestSuite($testClass)
    {
        if (is_string($testClass) && class_exists($testClass)) {
            $testClass = new ReflectionClass($testClass);
        }

        if (!is_object($testClass)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(
                1,
                'class name or object'
            );
        }

        if ($testClass instanceof self) {
            $this->addTest($testClass);
        } elseif ($testClass instanceof ReflectionClass) {
            $suiteMethod = false;

            if (!$testClass->isAbstract()) {
                if ($testClass->hasMethod(PHPUnit_Runner_BaseTestRunner::SUITE_METHODNAME)) {
                    $method = $testClass->getMethod(
                        PHPUnit_Runner_BaseTestRunner::SUITE_METHODNAME
                    );

                    if ($method->isStatic()) {
                        $this->addTest(
                            $method->invoke(null, $testClass->getName())
                        );

                        $suiteMethod = true;
                    }
                }
            }

            if (!$suiteMethod && !$testClass->isAbstract() && $testClass->isSubclassOf(PHPUnit_Framework_TestCase::class)) {
                $this->addTest(new self($testClass));
            }
        } else {
            throw new PHPUnit_Framework_Exception;
        }
    }

    /**
     * Wraps both <code>addTest()</code> and <code>addTestSuite</code>
     * as well as the separate import statements for the user's convenience.
     *
     * If the named file cannot be read or there are no new tests that can be
     * added, a <code>PHPUnit_Framework_WarningTestCase</code> will be created instead,
     * leaving the current test run untouched.
     *
     * @param string $filename
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function addTestFile($filename)
    {
        if (!is_string($filename)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(1, 'string');
        }

        if (file_exists($filename) && substr($filename, -5) == '.phpt') {
            $this->addTest(
                new PHPUnit_Extensions_PhptTestCase($filename)
            );

            return;
        }

        // The given file may contain further stub classes in addition to the
        // test class itself. Figure out the actual test class.
        $filename   = PHPUnit_Util_Fileloader::checkAndLoad($filename);
        $newClasses = array_diff(get_declared_classes(), $this->declaredClasses);

        // The diff is empty in case a parent class (with test methods) is added
        // AFTER a child class that inherited from it. To account for that case,
        // cumulate all discovered classes, so the parent class may be found in
        // a later invocation.
        if (!empty($newClasses)) {
            // On the assumption that test classes are defined first in files,
            // process discovered classes in approximate LIFO order, so as to
            // avoid unnecessary reflection.
            $this->foundClasses = array_merge($newClasses, $this->foundClasses);
            $this->declaredClasses = get_declared_classes();
        }

        // The test class's name must match the filename, either in full, or as
        // a PEAR/PSR-0 prefixed shortname ('NameSpace_ShortName'), or as a
        // PSR-1 local shortname ('NameSpace\ShortName'). The comparison must be
        // anchored to prevent false-positive matches (e.g., 'OtherShortName').
        $shortname      = basename($filename, '.php');
        $shortnameRegEx = '/(?:^|_|\\\\)' . preg_quote($shortname, '/') . '$/';

        foreach ($this->foundClasses as $i => $className) {
            if (preg_match($shortnameRegEx, $className)) {
                $class = new ReflectionClass($className);

                if ($class->getFileName() == $filename) {
                    $newClasses = [$className];
                    unset($this->foundClasses[$i]);
                    break;
                }
            }
        }

        foreach ($newClasses as $className) {
            if (strpos($className, 'PHPUnit_Framework') === 0) {
                continue;
            }

            $class = new ReflectionClass($className);

            if (!$class->isAbstract()) {
                if ($class->hasMethod(PHPUnit_Runner_BaseTestRunner::SUITE_METHODNAME)) {
                    $method = $class->getMethod(
                        PHPUnit_Runner_BaseTestRunner::SUITE_METHODNAME
                    );

                    if ($method->isStatic()) {
                        $this->addTest($method->invoke(null, $className));
                    }
                } elseif ($class->implementsInterface('PHPUnit_Framework_Test')) {
                    $this->addTestSuite($class);
                }
            }
        }

        $this->numTests = -1;
    }

    /**
     * Wrapper for addTestFile() that adds multiple test files.
     *
     * @param array|Iterator $filenames
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function addTestFiles($filenames)
    {
        if (!(is_array($filenames) ||
             (is_object($filenames) && $filenames instanceof Iterator))) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(
                1,
                'array or iterator'
            );
        }

        foreach ($filenames as $filename) {
            $this->addTestFile((string) $filename);
        }
    }

    /**
     * Counts the number of test cases that will be run by this test.
     *
     * @param bool $preferCache Indicates if cache is preferred.
     *
     * @return int
     */
    public function count($preferCache = false)
    {
        if ($preferCache && $this->cachedNumTests !== null) {
            $numTests = $this->cachedNumTests;
        } else {
            $numTests = 0;

            foreach ($this as $test) {
                $numTests += count($test);
            }

            $this->cachedNumTests = $numTests;
        }

        return $numTests;
    }

    /**
     * @param ReflectionClass $theClass
     * @param string          $name
     *
     * @return PHPUnit_Framework_Test
     *
     * @throws PHPUnit_Framework_Exception
     */
    public static function createTest(ReflectionClass $theClass, $name)
    {
        $className = $theClass->getName();

        if (!$theClass->isInstantiable()) {
            return self::warning(
                sprintf('Cannot instantiate class "%s".', $className)
            );
        }

        $backupSettings = PHPUnit_Util_Test::getBackupSettings(
            $className,
            $name
        );

        $preserveGlobalState = PHPUnit_Util_Test::getPreserveGlobalStateSettings(
            $className,
            $name
        );

        $runTestInSeparateProcess = PHPUnit_Util_Test::getProcessIsolationSettings(
            $className,
            $name
        );

        $constructor = $theClass->getConstructor();

        if ($constructor !== null) {
            $parameters = $constructor->getParameters();

            // TestCase() or TestCase($name)
            if (count($parameters) < 2) {
                $test = new $className;
            } // TestCase($name, $data)
            else {
                try {
                    $data = PHPUnit_Util_Test::getProvidedData(
                        $className,
                        $name
                    );
                } catch (PHPUnit_Framework_IncompleteTestError $e) {
                    $message = sprintf(
                        'Test for %s::%s marked incomplete by data provider',
                        $className,
                        $name
                    );

                    $_message = $e->getMessage();

                    if (!empty($_message)) {
                        $message .= "\n" . $_message;
                    }

                    $data = self::incompleteTest($className, $name, $message);
                } catch (PHPUnit_Framework_SkippedTestError $e) {
                    $message = sprintf(
                        'Test for %s::%s skipped by data provider',
                        $className,
                        $name
                    );

                    $_message = $e->getMessage();

                    if (!empty($_message)) {
                        $message .= "\n" . $_message;
                    }

                    $data = self::skipTest($className, $name, $message);
                } catch (Throwable $_t) {
                    $t = $_t;
                } catch (Exception $_t) {
                    $t = $_t;
                }

                if (isset($t)) {
                    $message = sprintf(
                        'The data provider specified for %s::%s is invalid.',
                        $className,
                        $name
                    );

                    $_message = $t->getMessage();

                    if (!empty($_message)) {
                        $message .= "\n" . $_message;
                    }

                    $data = self::warning($message);
                }

                // Test method with @dataProvider.
                if (isset($data)) {
                    $test = new PHPUnit_Framework_TestSuite_DataProvider(
                        $className . '::' . $name
                    );

                    if (empty($data)) {
                        $data = self::warning(
                            sprintf(
                                'No tests found in suite "%s".',
                                $test->getName()
                            )
                        );
                    }

                    $groups = PHPUnit_Util_Test::getGroups($className, $name);

                    if ($data instanceof PHPUnit_Framework_WarningTestCase ||
                        $data instanceof PHPUnit_Framework_SkippedTestCase ||
                        $data instanceof PHPUnit_Framework_IncompleteTestCase) {
                        $test->addTest($data, $groups);
                    } else {
                        foreach ($data as $_dataName => $_data) {
                            $_test = new $className($name, $_data, $_dataName);

                            if ($runTestInSeparateProcess) {
                                $_test->setRunTestInSeparateProcess(true);

                                if ($preserveGlobalState !== null) {
                                    $_test->setPreserveGlobalState($preserveGlobalState);
                                }
                            }

                            if ($backupSettings['backupGlobals'] !== null) {
                                $_test->setBackupGlobals(
                                    $backupSettings['backupGlobals']
                                );
                            }

                            if ($backupSettings['backupStaticAttributes'] !== null) {
                                $_test->setBackupStaticAttributes(
                                    $backupSettings['backupStaticAttributes']
                                );
                            }

                            $test->addTest($_test, $groups);
                        }
                    }
                } else {
                    $test = new $className;
                }
            }
        }

        if (!isset($test)) {
            throw new PHPUnit_Framework_Exception('No valid test provided.');
        }

        if ($test instanceof PHPUnit_Framework_TestCase) {
            $test->setName($name);

            if ($runTestInSeparateProcess) {
                $test->setRunTestInSeparateProcess(true);

                if ($preserveGlobalState !== null) {
                    $test->setPreserveGlobalState($preserveGlobalState);
                }
            }

            if ($backupSettings['backupGlobals'] !== null) {
                $test->setBackupGlobals($backupSettings['backupGlobals']);
            }

            if ($backupSettings['backupStaticAttributes'] !== null) {
                $test->setBackupStaticAttributes(
                    $backupSettings['backupStaticAttributes']
                );
            }
        }

        return $test;
    }

    /**
     * Creates a default TestResult object.
     *
     * @return PHPUnit_Framework_TestResult
     */
    protected function createResult()
    {
        return new PHPUnit_Framework_TestResult;
    }

    /**
     * Returns the name of the suite.
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Returns the test groups of the suite.
     *
     * @return array
     */
    public function getGroups()
    {
        return array_keys($this->groups);
    }

    public function getGroupDetails()
    {
        return $this->groups;
    }

    /**
     * Set tests groups of the test case
     *
     * @param array $groups
     */
    public function setGroupDetails(array $groups)
    {
        $this->groups = $groups;
    }

    /**
     * Runs the tests and collects their result in a TestResult.
     *
     * @param PHPUnit_Framework_TestResult $result
     *
     * @return PHPUnit_Framework_TestResult
     */
    public function run(PHPUnit_Framework_TestResult $result = null)
    {
        if ($result === null) {
            $result = $this->createResult();
        }

        if (count($this) == 0) {
            return $result;
        }

        $hookMethods = PHPUnit_Util_Test::getHookMethods($this->name);

        $result->startTestSuite($this);

        try {
            $this->setUp();

            foreach ($hookMethods['beforeClass'] as $beforeClassMethod) {
                if ($this->testCase === true &&
                    class_exists($this->name, false) &&
                    method_exists($this->name, $beforeClassMethod)) {
                    if ($missingRequirements = PHPUnit_Util_Test::getMissingRequirements($this->name, $beforeClassMethod)) {
                        $this->markTestSuiteSkipped(implode(PHP_EOL, $missingRequirements));
                    }

                    call_user_func([$this->name, $beforeClassMethod]);
                }
            }
        } catch (PHPUnit_Framework_SkippedTestSuiteError $e) {
            $numTests = count($this);

            for ($i = 0; $i < $numTests; $i++) {
                $result->startTest($this);
                $result->addFailure($this, $e, 0);
                $result->endTest($this, 0);
            }

            $this->tearDown();
            $result->endTestSuite($this);

            return $result;
        } catch (Throwable $_t) {
            $t = $_t;
        } catch (Exception $_t) {
            $t = $_t;
        }

        if (isset($t)) {
            $numTests = count($this);

            for ($i = 0; $i < $numTests; $i++) {
                if ($result->shouldStop()) {
                    break;
                }

                $result->startTest($this);
                $result->addError($this, $t, 0);
                $result->endTest($this, 0);
            }

            $this->tearDown();
            $result->endTestSuite($this);

            return $result;
        }

        foreach ($this as $test) {
            if ($result->shouldStop()) {
                break;
            }

            if ($test instanceof PHPUnit_Framework_TestCase ||
                $test instanceof self) {
                $test->setBeStrictAboutChangesToGlobalState($this->beStrictAboutChangesToGlobalState);
                $test->setBackupGlobals($this->backupGlobals);
                $test->setBackupStaticAttributes($this->backupStaticAttributes);
                $test->setRunTestInSeparateProcess($this->runTestInSeparateProcess);
            }

            $test->run($result);
        }

        foreach ($hookMethods['afterClass'] as $afterClassMethod) {
            if ($this->testCase === true && class_exists($this->name, false) && method_exists($this->name, $afterClassMethod)) {
                call_user_func([$this->name, $afterClassMethod]);
            }
        }

        $this->tearDown();

        $result->endTestSuite($this);

        return $result;
    }

    /**
     * @param bool $runTestInSeparateProcess
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function setRunTestInSeparateProcess($runTestInSeparateProcess)
    {
        if (is_bool($runTestInSeparateProcess)) {
            $this->runTestInSeparateProcess = $runTestInSeparateProcess;
        } else {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(1, 'boolean');
        }
    }

    /**
     * Runs a test.
     *
     * @deprecated
     *
     * @param PHPUnit_Framework_Test       $test
     * @param PHPUnit_Framework_TestResult $result
     */
    public function runTest(PHPUnit_Framework_Test $test, PHPUnit_Framework_TestResult $result)
    {
        $test->run($result);
    }

    /**
     * Sets the name of the suite.
     *
     * @param  string
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * Returns the test at the given index.
     *
     * @param  int|false
     *
     * @return PHPUnit_Framework_Test
     */
    public function testAt($index)
    {
        if (isset($this->tests[$index])) {
            return $this->tests[$index];
        } else {
            return false;
        }
    }

    /**
     * Returns the tests as an enumeration.
     *
     * @return array
     */
    public function tests()
    {
        return $this->tests;
    }

    /**
     * Set tests of the test suite
     *
     * @param array $tests
     */
    public function setTests(array $tests)
    {
        $this->tests = $tests;
    }

    /**
     * Mark the test suite as skipped.
     *
     * @param string $message
     *
     * @throws PHPUnit_Framework_SkippedTestSuiteError
     */
    public function markTestSuiteSkipped($message = '')
    {
        throw new PHPUnit_Framework_SkippedTestSuiteError($message);
    }

    /**
     * @param ReflectionClass  $class
     * @param ReflectionMethod $method
     */
    protected function addTestMethod(ReflectionClass $class, ReflectionMethod $method)
    {
        if (!$this->isTestMethod($method)) {
            return;
        }

        $name = $method->getName();

        if (!$method->isPublic()) {
            $this->addTest(
                self::warning(
                    sprintf(
                        'Test method "%s" in test class "%s" is not public.',
                        $name,
                        $class->getName()
                    )
                )
            );

            return;
        }

        $test = self::createTest($class, $name);

        if ($test instanceof PHPUnit_Framework_TestCase ||
            $test instanceof PHPUnit_Framework_TestSuite_DataProvider) {
            $test->setDependencies(
                PHPUnit_Util_Test::getDependencies($class->getName(), $name)
            );
        }

        $this->addTest(
            $test,
            PHPUnit_Util_Test::getGroups($class->getName(), $name)
        );
    }

    /**
     * @param ReflectionMethod $method
     *
     * @return bool
     */
    public static function isTestMethod(ReflectionMethod $method)
    {
        if (strpos($method->name, 'test') === 0) {
            return true;
        }

        // @scenario on TestCase::testMethod()
        // @test     on TestCase::testMethod()
        $docComment = $method->getDocComment();

        return strpos($docComment, '@test') !== false ||
               strpos($docComment, '@scenario') !== false;
    }

    /**
     * @param string $message
     *
     * @return PHPUnit_Framework_WarningTestCase
     */
    protected static function warning($message)
    {
        return new PHPUnit_Framework_WarningTestCase($message);
    }

    /**
     * @param string $class
     * @param string $methodName
     * @param string $message
     *
     * @return PHPUnit_Framework_SkippedTestCase
     */
    protected static function skipTest($class, $methodName, $message)
    {
        return new PHPUnit_Framework_SkippedTestCase($class, $methodName, $message);
    }

    /**
     * @param string $class
     * @param string $methodName
     * @param string $message
     *
     * @return PHPUnit_Framework_IncompleteTestCase
     */
    protected static function incompleteTest($class, $methodName, $message)
    {
        return new PHPUnit_Framework_IncompleteTestCase($class, $methodName, $message);
    }

    /**
     * @param bool $beStrictAboutChangesToGlobalState
     */
    public function setBeStrictAboutChangesToGlobalState($beStrictAboutChangesToGlobalState)
    {
        if (is_null($this->beStrictAboutChangesToGlobalState) && is_bool($beStrictAboutChangesToGlobalState)) {
            $this->beStrictAboutChangesToGlobalState = $beStrictAboutChangesToGlobalState;
        }
    }

    /**
     * @param bool $backupGlobals
     */
    public function setBackupGlobals($backupGlobals)
    {
        if (is_null($this->backupGlobals) && is_bool($backupGlobals)) {
            $this->backupGlobals = $backupGlobals;
        }
    }

    /**
     * @param bool $backupStaticAttributes
     */
    public function setBackupStaticAttributes($backupStaticAttributes)
    {
        if (is_null($this->backupStaticAttributes) &&
            is_bool($backupStaticAttributes)) {
            $this->backupStaticAttributes = $backupStaticAttributes;
        }
    }

    /**
     * Returns an iterator for this test suite.
     *
     * @return RecursiveIteratorIterator
     */
    public function getIterator()
    {
        $iterator = new PHPUnit_Util_TestSuiteIterator($this);

        if ($this->iteratorFilter !== null) {
            $iterator = $this->iteratorFilter->factory($iterator, $this);
        }

        return $iterator;
    }

    public function injectFilter(PHPUnit_Runner_Filter_Factory $filter)
    {
        $this->iteratorFilter = $filter;
        foreach ($this as $test) {
            if ($test instanceof self) {
                $test->injectFilter($filter);
            }
        }
    }

    /**
     * Template Method that is called before the tests
     * of this test suite are run.
     */
    protected function setUp()
    {
    }

    /**
     * Template Method that is called after the tests
     * of this test suite have finished running.
     */
    protected function tearDown()
    {
    }
}
