<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'NoArgTestCaseTest.php';
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'Singleton.php';
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'Mockable.php';

$GLOBALS['a']  = 'a';
$_ENV['b']     = 'b';
$_POST['c']    = 'c';
$_GET['d']     = 'd';
$_COOKIE['e']  = 'e';
$_SERVER['f']  = 'f';
$_FILES['g']   = 'g';
$_REQUEST['h'] = 'h';
$GLOBALS['i']  = 'i';

class Framework_TestCaseTest extends PHPUnit_Framework_TestCase
{
    protected $backupGlobalsBlacklist = ['i', 'singleton'];

    /**
     * Used be testStaticAttributesBackupPre
     */
    protected static $testStatic = 0;

    public function testCaseToString()
    {
        $this->assertEquals(
            'Framework_TestCaseTest::testCaseToString',
            $this->toString()
        );
    }

    public function testSuccess()
    {
        $test   = new Success;
        $result = $test->run();

        $this->assertEquals(PHPUnit_Runner_BaseTestRunner::STATUS_PASSED, $test->getStatus());
        $this->assertEquals(0, $result->errorCount());
        $this->assertEquals(0, $result->failureCount());
        $this->assertEquals(0, $result->skippedCount());
        $this->assertCount(1, $result);
    }

    public function testFailure()
    {
        $test   = new Failure;
        $result = $test->run();

        $this->assertEquals(PHPUnit_Runner_BaseTestRunner::STATUS_FAILURE, $test->getStatus());
        $this->assertEquals(0, $result->errorCount());
        $this->assertEquals(1, $result->failureCount());
        $this->assertEquals(0, $result->skippedCount());
        $this->assertCount(1, $result);
    }

    public function testError()
    {
        $test   = new TestError;
        $result = $test->run();

        $this->assertEquals(PHPUnit_Runner_BaseTestRunner::STATUS_ERROR, $test->getStatus());
        $this->assertEquals(1, $result->errorCount());
        $this->assertEquals(0, $result->failureCount());
        $this->assertEquals(0, $result->skippedCount());
        $this->assertCount(1, $result);
    }

    public function testSkipped()
    {
        $test   = new TestSkipped();
        $result = $test->run();

        $this->assertEquals(PHPUnit_Runner_BaseTestRunner::STATUS_SKIPPED, $test->getStatus());
        $this->assertEquals('Skipped test', $test->getStatusMessage());
        $this->assertEquals(0, $result->errorCount());
        $this->assertEquals(0, $result->failureCount());
        $this->assertEquals(1, $result->skippedCount());
        $this->assertCount(1, $result);
    }

    public function testIncomplete()
    {
        $test   = new TestIncomplete();
        $result = $test->run();

        $this->assertEquals(PHPUnit_Runner_BaseTestRunner::STATUS_INCOMPLETE, $test->getStatus());
        $this->assertEquals('Incomplete test', $test->getStatusMessage());
        $this->assertEquals(0, $result->errorCount());
        $this->assertEquals(0, $result->failureCount());
        $this->assertEquals(0, $result->skippedCount());
        $this->assertCount(1, $result);
    }

    public function testExceptionInSetUp()
    {
        $test   = new ExceptionInSetUpTest('testSomething');
        $result = $test->run();

        $this->assertTrue($test->setUp);
        $this->assertFalse($test->assertPreConditions);
        $this->assertFalse($test->testSomething);
        $this->assertFalse($test->assertPostConditions);
        $this->assertTrue($test->tearDown);
    }

    public function testExceptionInAssertPreConditions()
    {
        $test   = new ExceptionInAssertPreConditionsTest('testSomething');
        $result = $test->run();

        $this->assertTrue($test->setUp);
        $this->assertTrue($test->assertPreConditions);
        $this->assertFalse($test->testSomething);
        $this->assertFalse($test->assertPostConditions);
        $this->assertTrue($test->tearDown);
    }

    public function testExceptionInTest()
    {
        $test   = new ExceptionInTest('testSomething');
        $result = $test->run();

        $this->assertTrue($test->setUp);
        $this->assertTrue($test->assertPreConditions);
        $this->assertTrue($test->testSomething);
        $this->assertFalse($test->assertPostConditions);
        $this->assertTrue($test->tearDown);
    }

    public function testExceptionInAssertPostConditions()
    {
        $test   = new ExceptionInAssertPostConditionsTest('testSomething');
        $result = $test->run();

        $this->assertTrue($test->setUp);
        $this->assertTrue($test->assertPreConditions);
        $this->assertTrue($test->testSomething);
        $this->assertTrue($test->assertPostConditions);
        $this->assertTrue($test->tearDown);
    }

    public function testExceptionInTearDown()
    {
        $test   = new ExceptionInTearDownTest('testSomething');
        $result = $test->run();

        $this->assertTrue($test->setUp);
        $this->assertTrue($test->assertPreConditions);
        $this->assertTrue($test->testSomething);
        $this->assertTrue($test->assertPostConditions);
        $this->assertTrue($test->tearDown);
        $this->assertEquals(PHPUnit_Runner_BaseTestRunner::STATUS_ERROR, $test->getStatus());
    }

    public function testNoArgTestCasePasses()
    {
        $result = new PHPUnit_Framework_TestResult;
        $t      = new PHPUnit_Framework_TestSuite('NoArgTestCaseTest');

        $t->run($result);

        $this->assertCount(1, $result);
        $this->assertEquals(0, $result->failureCount());
        $this->assertEquals(0, $result->errorCount());
    }

    public function testWasRun()
    {
        $test = new WasRun;
        $test->run();

        $this->assertTrue($test->wasRun);
    }

    public function testException()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class);

        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExceptionWithEmptyMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class, '');

        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExceptionWithNullMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class, null);

        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExceptionWithMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class);
        $test->expectExceptionMessage('A runtime error occurred');

        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExceptionWithWrongMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class);
        $test->expectExceptionMessage('A logic error occurred');

        $result = $test->run();

        $this->assertEquals(1, $result->failureCount());
        $this->assertCount(1, $result);
        $this->assertEquals(
            "Failed asserting that exception message 'A runtime error occurred' contains 'A logic error occurred'.",
            $test->getStatusMessage()
        );
    }

    public function testExceptionWithRegexpMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class);
        $test->expectExceptionMessageRegExp('/runtime .*? occurred/');

        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExceptionWithWrongRegexpMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class);
        $test->expectExceptionMessageRegExp('/logic .*? occurred/');

        $result = $test->run();

        $this->assertEquals(1, $result->failureCount());
        $this->assertCount(1, $result);
        $this->assertEquals(
            "Failed asserting that exception message 'A runtime error occurred' matches '/logic .*? occurred/'.",
            $test->getStatusMessage()
        );
    }

    public function testExceptionWithInvalidRegexpMessage()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(RuntimeException::class);
        $test->expectExceptionMessageRegExp('#runtime .*? occurred/');

        $test->run();

        $this->assertEquals(
            "Invalid expected exception message regex given: '#runtime .*? occurred/'",
            $test->getStatusMessage()
        );
    }

    public function testNoException()
    {
        $test = new ThrowNoExceptionTestCase('test');
        $test->expectException(RuntimeException::class);

        $result = $test->run();

        $this->assertEquals(1, $result->failureCount());
        $this->assertCount(1, $result);
    }

    public function testWrongException()
    {
        $test = new ThrowExceptionTestCase('test');
        $test->expectException(InvalidArgumentException::class);

        $result = $test->run();

        $this->assertEquals(1, $result->failureCount());
        $this->assertCount(1, $result);
    }

    /**
     * @backupGlobals enabled
     */
    public function testGlobalsBackupPre()
    {
        global $a;
        global $i;

        $this->assertEquals('a', $a);
        $this->assertEquals('a', $GLOBALS['a']);
        $this->assertEquals('b', $_ENV['b']);
        $this->assertEquals('c', $_POST['c']);
        $this->assertEquals('d', $_GET['d']);
        $this->assertEquals('e', $_COOKIE['e']);
        $this->assertEquals('f', $_SERVER['f']);
        $this->assertEquals('g', $_FILES['g']);
        $this->assertEquals('h', $_REQUEST['h']);
        $this->assertEquals('i', $i);
        $this->assertEquals('i', $GLOBALS['i']);

        $GLOBALS['a']   = 'aa';
        $GLOBALS['foo'] = 'bar';
        $_ENV['b']      = 'bb';
        $_POST['c']     = 'cc';
        $_GET['d']      = 'dd';
        $_COOKIE['e']   = 'ee';
        $_SERVER['f']   = 'ff';
        $_FILES['g']    = 'gg';
        $_REQUEST['h']  = 'hh';
        $GLOBALS['i']   = 'ii';

        $this->assertEquals('aa', $a);
        $this->assertEquals('aa', $GLOBALS['a']);
        $this->assertEquals('bar', $GLOBALS['foo']);
        $this->assertEquals('bb', $_ENV['b']);
        $this->assertEquals('cc', $_POST['c']);
        $this->assertEquals('dd', $_GET['d']);
        $this->assertEquals('ee', $_COOKIE['e']);
        $this->assertEquals('ff', $_SERVER['f']);
        $this->assertEquals('gg', $_FILES['g']);
        $this->assertEquals('hh', $_REQUEST['h']);
        $this->assertEquals('ii', $i);
        $this->assertEquals('ii', $GLOBALS['i']);
    }

    public function testGlobalsBackupPost()
    {
        global $a;
        global $i;

        $this->assertEquals('a', $a);
        $this->assertEquals('a', $GLOBALS['a']);
        $this->assertEquals('b', $_ENV['b']);
        $this->assertEquals('c', $_POST['c']);
        $this->assertEquals('d', $_GET['d']);
        $this->assertEquals('e', $_COOKIE['e']);
        $this->assertEquals('f', $_SERVER['f']);
        $this->assertEquals('g', $_FILES['g']);
        $this->assertEquals('h', $_REQUEST['h']);
        $this->assertEquals('ii', $i);
        $this->assertEquals('ii', $GLOBALS['i']);

        $this->assertArrayNotHasKey('foo', $GLOBALS);
    }

    /**
     * @backupGlobals enabled
     * @backupStaticAttributes enabled
     */
    public function testStaticAttributesBackupPre()
    {
        $GLOBALS['singleton'] = Singleton::getInstance();
        self::$testStatic     = 123;
    }

    /**
     * @depends testStaticAttributesBackupPre
     */
    public function testStaticAttributesBackupPost()
    {
        $this->assertNotSame($GLOBALS['singleton'], Singleton::getInstance());
        $this->assertSame(0, self::$testStatic);
    }

    public function testIsInIsolationReturnsFalse()
    {
        $test   = new IsolationTest('testIsInIsolationReturnsFalse');
        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testIsInIsolationReturnsTrue()
    {
        $test   = new IsolationTest('testIsInIsolationReturnsTrue');
        $test->setRunTestInSeparateProcess(true);
        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExpectOutputStringFooActualFoo()
    {
        $test   = new OutputTestCase('testExpectOutputStringFooActualFoo');
        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExpectOutputStringFooActualBar()
    {
        $test   = new OutputTestCase('testExpectOutputStringFooActualBar');
        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertFalse($result->wasSuccessful());
    }

    public function testExpectOutputRegexFooActualFoo()
    {
        $test   = new OutputTestCase('testExpectOutputRegexFooActualFoo');
        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertTrue($result->wasSuccessful());
    }

    public function testExpectOutputRegexFooActualBar()
    {
        $test   = new OutputTestCase('testExpectOutputRegexFooActualBar');
        $result = $test->run();

        $this->assertCount(1, $result);
        $this->assertFalse($result->wasSuccessful());
    }

    public function testSkipsIfRequiresHigherVersionOfPHPUnit()
    {
        $test   = new RequirementsTest('testAlwaysSkip');
        $result = $test->run();

        $this->assertEquals(1, $result->skippedCount());
        $this->assertEquals(
            'PHPUnit >= 1111111 is required.',
            $test->getStatusMessage()
        );
    }

    public function testSkipsIfRequiresHigherVersionOfPHP()
    {
        $test   = new RequirementsTest('testAlwaysSkip2');
        $result = $test->run();

        $this->assertEquals(1, $result->skippedCount());
        $this->assertEquals(
            'PHP >= 9999999 is required.',
            $test->getStatusMessage()
        );
    }

    public function testSkipsIfRequiresNonExistingOs()
    {
        $test   = new RequirementsTest('testAlwaysSkip3');
        $result = $test->run();

        $this->assertEquals(1, $result->skippedCount());
        $this->assertEquals(
            'Operating system matching /DOESNOTEXIST/i is required.',
            $test->getStatusMessage()
        );
    }

    public function testSkipsIfRequiresNonExistingFunction()
    {
        $test   = new RequirementsTest('testNine');
        $result = $test->run();

        $this->assertEquals(1, $result->skippedCount());
        $this->assertEquals(
            'Function testFunc is required.',
            $test->getStatusMessage()
        );
    }

    public function testSkipsIfRequiresNonExistingExtension()
    {
        $test   = new RequirementsTest('testTen');
        $result = $test->run();

        $this->assertEquals(
            'Extension testExt is required.',
            $test->getStatusMessage()
        );
    }

    public function testSkipsIfRequiresExtensionWithAMinimumVersion()
    {
        $test   = new RequirementsTest('testSpecificExtensionVersion');
        $result = $test->run();

        $this->assertEquals(
            'Extension testExt >= 1.8.0 is required.',
            $test->getStatusMessage()
        );
    }

    public function testSkipsProvidesMessagesForAllSkippingReasons()
    {
        $test   = new RequirementsTest('testAllPossibleRequirements');
        $result = $test->run();

        $this->assertEquals(
            'PHP >= 99-dev is required.' . PHP_EOL .
            'PHPUnit >= 9-dev is required.' . PHP_EOL .
            'Operating system matching /DOESNOTEXIST/i is required.' . PHP_EOL .
            'Function testFuncOne is required.' . PHP_EOL .
            'Function testFuncTwo is required.' . PHP_EOL .
            'Extension testExtOne is required.' . PHP_EOL .
            'Extension testExtTwo is required.' . PHP_EOL .
            'Extension testExtThree >= 2.0 is required.',
            $test->getStatusMessage()
        );
    }

    public function testRequiringAnExistingMethodDoesNotSkip()
    {
        $test   = new RequirementsTest('testExistingMethod');
        $result = $test->run();
        $this->assertEquals(0, $result->skippedCount());
    }

    public function testRequiringAnExistingFunctionDoesNotSkip()
    {
        $test   = new RequirementsTest('testExistingFunction');
        $result = $test->run();
        $this->assertEquals(0, $result->skippedCount());
    }

    public function testRequiringAnExistingExtensionDoesNotSkip()
    {
        $test   = new RequirementsTest('testExistingExtension');
        $result = $test->run();
        $this->assertEquals(0, $result->skippedCount());
    }

    public function testRequiringAnExistingOsDoesNotSkip()
    {
        $test   = new RequirementsTest('testExistingOs');
        $result = $test->run();
        $this->assertEquals(0, $result->skippedCount());
    }

    public function testCurrentWorkingDirectoryIsRestored()
    {
        $expectedCwd = getcwd();

        $test = new ChangeCurrentWorkingDirectoryTest('testSomethingThatChangesTheCwd');
        $test->run();

        $this->assertSame($expectedCwd, getcwd());
    }

    /**
     * @requires PHP 7
     * @expectedException TypeError
     */
    public function testTypeErrorCanBeExpected()
    {
        $o = new ClassWithScalarTypeDeclarations;
        $o->foo(null, null);
    }

    public function testCreateMockFromClassName()
    {
        $mock = $this->createMock(Mockable::class);

        $this->assertInstanceOf(Mockable::class, $mock);
        $this->assertInstanceOf(PHPUnit_Framework_MockObject_MockObject::class, $mock);
    }

    public function testCreateMockMocksAllMethods()
    {
        /** @var Mockable $mock */
        $mock = $this->createMock(Mockable::class);

        $this->assertNull($mock->foo());
        $this->assertNull($mock->bar());
    }

    public function testCreatePartialMockDoesNotMockAllMethods()
    {
        /** @var Mockable $mock */
        $mock = $this->createPartialMock(Mockable::class, ['foo']);

        $this->assertNull($mock->foo());
        $this->assertTrue($mock->bar());
    }

    public function testCreatePartialMockCanMockNoMethods()
    {
        /** @var Mockable $mock */
        $mock = $this->createPartialMock(Mockable::class, []);

        $this->assertTrue($mock->foo());
        $this->assertTrue($mock->bar());
    }

    public function testCreateMockSkipsConstructor()
    {
        /** @var Mockable $mock */
        $mock = $this->createMock(Mockable::class);

        $this->assertFalse($mock->constructorCalled);
    }

    public function testCreateMockDisablesOriginalClone()
    {
        /** @var Mockable $mock */
        $mock = $this->createMock(Mockable::class);

        $cloned = clone $mock;
        $this->assertFalse($cloned->cloned);
    }

    public function testConfiguredMockCanBeCreated()
    {
        /** @var Mockable $mock */
        $mock = $this->createConfiguredMock(
            Mockable::class,
            [
                'foo' => false
            ]
        );

        $this->assertFalse($mock->foo());
        $this->assertNull($mock->bar());
    }

    public function testProvidingOfAutoreferencedArray()
    {
        $test = new \TestAutoreferenced('testJsonEncodeException', $this->getAutoreferencedArray());
        $test->runBare();

        $this->assertInternalType('array', $test->myTestData);
        $this->assertArrayHasKey('data', $test->myTestData);
        $this->assertEquals($test->myTestData['data'][0], $test->myTestData['data']);
    }

    /**
     * @return array
     */
    private function getAutoreferencedArray()
    {
        $recursionData   = [];
        $recursionData[] = &$recursionData;

        return [
            'RECURSION' => [
                'data' => $recursionData
            ]
        ];
    }

    public function testProvidingArrayThatMixesObjectsAndScalars()
    {
        $data = [
            [123],
            ['foo'],
            [$this->createMock(Mockable::class)],
        ];

        $test = new \TestAutoreferenced('testJsonEncodeException', [$data]);
        $test->runBare();

        $this->assertInternalType('array', $test->myTestData);
        $this->assertSame($data, $test->myTestData);
    }
}
