<?php
/*
 * This file is part of php-token-stream.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use PHPUnit\Framework\TestCase;

class PHP_Token_ClassTest extends TestCase
{
    /**
     * @var PHP_Token_CLASS
     */
    private $class;

    /**
     * @var PHP_Token_FUNCTION
     */
    private $function;

    protected function setUp()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'source2.php');

        foreach ($ts as $token) {
            if ($token instanceof PHP_Token_CLASS) {
                $this->class = $token;
            }

            if ($token instanceof PHP_Token_FUNCTION) {
                $this->function = $token;
                break;
            }
        }
    }

    /**
     * @covers PHP_Token_CLASS::getKeywords
     */
    public function testGetClassKeywords()
    {
        $this->assertEquals('abstract', $this->class->getKeywords());
    }

    /**
     * @covers PHP_Token_FUNCTION::getKeywords
     */
    public function testGetFunctionKeywords()
    {
        $this->assertEquals('abstract,static', $this->function->getKeywords());
    }

    /**
     * @covers PHP_Token_FUNCTION::getVisibility
     */
    public function testGetFunctionVisibility()
    {
        $this->assertEquals('public', $this->function->getVisibility());
    }

    public function testIssue19()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'issue19.php');

        foreach ($ts as $token) {
            if ($token instanceof PHP_Token_CLASS) {
                $this->assertFalse($token->hasInterfaces());
            }
        }
    }

    public function testIssue30()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'issue30.php');
        $this->assertCount(1, $ts->getClasses());
    }

    public function testAnonymousClassesAreHandledCorrectly()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'class_with_method_that_declares_anonymous_class.php');

        $classes = $ts->getClasses();

        $this->assertEquals(
            [
                'class_with_method_that_declares_anonymous_class',
                'AnonymousClass:9#31',
                'AnonymousClass:10#55',
                'AnonymousClass:11#75',
                'AnonymousClass:12#91',
                'AnonymousClass:13#107'
            ],
            array_keys($classes)
        );
    }

    /**
     * @ticket https://github.com/sebastianbergmann/php-token-stream/issues/52
     */
    public function testAnonymousClassesAreHandledCorrectly2()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'class_with_method_that_declares_anonymous_class2.php');

        $classes = $ts->getClasses();

        $this->assertEquals(['Test', 'AnonymousClass:4#23'], array_keys($classes));
        $this->assertEquals(['methodOne', 'methodTwo'], array_keys($classes['Test']['methods']));

        $this->assertEmpty($ts->getFunctions());
    }

    public function testImportedFunctionsAreHandledCorrectly()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'classUsesNamespacedFunction.php');

        $this->assertEmpty($ts->getFunctions());
        $this->assertCount(1, $ts->getClasses());
    }

    /**
     * @ticket https://github.com/sebastianbergmann/php-code-coverage/issues/543
     */
    public function testClassWithMultipleAnonymousClassesAndFunctionsIsHandledCorrectly()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'class_with_multiple_anonymous_classes_and_functions.php');

        $classes = $ts->getClasses();

        $this->assertArrayHasKey('class_with_multiple_anonymous_classes_and_functions', $classes);
        $this->assertArrayHasKey('AnonymousClass:6#23', $classes);
        $this->assertArrayHasKey('AnonymousClass:12#53', $classes);
        $this->assertArrayHasKey('m', $classes['class_with_multiple_anonymous_classes_and_functions']['methods']);
        $this->assertArrayHasKey('anonymousFunction:18#81', $classes['class_with_multiple_anonymous_classes_and_functions']['methods']);
        $this->assertArrayHasKey('anonymousFunction:22#108', $classes['class_with_multiple_anonymous_classes_and_functions']['methods']);
    }

    /**
     * @ticket https://github.com/sebastianbergmann/php-token-stream/issues/68
     */
    public function testClassWithMethodNamedEmptyIsHandledCorrectly()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'class_with_method_named_empty.php');

        $classes = $ts->getClasses();

        $this->assertArrayHasKey('class_with_method_named_empty', $classes);
        $this->assertArrayHasKey('empty', $classes['class_with_method_named_empty']['methods']);
    }

    /**
     * @ticket https://github.com/sebastianbergmann/php-code-coverage/issues/424
     */
    public function testSomething()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'php-code-coverage-issue-424.php');

        $classes = $ts->getClasses();

        $this->assertSame(5, $classes['Example']['methods']['even']['startLine']);
        $this->assertSame(12, $classes['Example']['methods']['even']['endLine']);

        $this->assertSame(7, $classes['Example']['methods']['anonymousFunction:7#28']['startLine']);
        $this->assertSame(9, $classes['Example']['methods']['anonymousFunction:7#28']['endLine']);
    }
}
