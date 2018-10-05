<?php
class ExceptionTest extends PHPUnit_Framework_TestCase
{
    /**
     * Exception message
     *
     * @var string
     */
    const ERROR_MESSAGE = 'Exception message';

    /**
     * Exception message
     *
     * @var string
     */
    const ERROR_MESSAGE_REGEX = '#regex#';

    /**
     * Exception code
     *
     * @var int
     */
    const ERROR_CODE = 500;

    /**
     * @expectedException FooBarBaz
     */
    public function testOne()
    {
    }

    /**
     * @expectedException Foo_Bar_Baz
     */
    public function testTwo()
    {
    }

    /**
     * @expectedException Foo\Bar\Baz
     */
    public function testThree()
    {
    }

    /**
     * @expectedException ほげ
     */
    public function testFour()
    {
    }

    /**
     * @expectedException Class Message 1234
     */
    public function testFive()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionMessage Message
     * @expectedExceptionCode 1234
     */
    public function testSix()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionMessage Message
     * @expectedExceptionCode ExceptionCode
     */
    public function testSeven()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionMessage Message
     * @expectedExceptionCode 0
     */
    public function testEight()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionMessage ExceptionTest::ERROR_MESSAGE
     * @expectedExceptionCode ExceptionTest::ERROR_CODE
     */
    public function testNine()
    {
    }

    /** @expectedException Class */
    public function testSingleLine()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionCode ExceptionTest::UNKNOWN_CODE_CONSTANT
     * @expectedExceptionMessage ExceptionTest::UNKNOWN_MESSAGE_CONSTANT
     */
    public function testUnknownConstants()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionCode 1234
     * @expectedExceptionMessage Message
     * @expectedExceptionMessageRegExp #regex#
     */
    public function testWithRegexMessage()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionCode 1234
     * @expectedExceptionMessage Message
     * @expectedExceptionMessageRegExp ExceptionTest::ERROR_MESSAGE_REGEX
     */
    public function testWithRegexMessageFromClassConstant()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionCode 1234
     * @expectedExceptionMessage Message
     * @expectedExceptionMessageRegExp ExceptionTest::UNKNOWN_MESSAGE_REGEX_CONSTANT
     */
    public function testWithUnknowRegexMessageFromClassConstant()
    {
    }
}
