<?php

namespace My\Space;

class ExceptionNamespaceTest extends \PHPUnit_Framework_TestCase
{
    /**
     * Exception message
     *
     * @var string
     */
    const ERROR_MESSAGE = 'Exception namespace message';

    /**
     * Exception code
     *
     * @var int
     */
    const ERROR_CODE = 200;

    /**
     * @expectedException Class
     * @expectedExceptionMessage My\Space\ExceptionNamespaceTest::ERROR_MESSAGE
     * @expectedExceptionCode My\Space\ExceptionNamespaceTest::ERROR_CODE
     */
    public function testConstants()
    {
    }

    /**
     * @expectedException Class
     * @expectedExceptionCode My\Space\ExceptionNamespaceTest::UNKNOWN_CODE_CONSTANT
     * @expectedExceptionMessage My\Space\ExceptionNamespaceTest::UNKNOWN_MESSAGE_CONSTANT
     */
    public function testUnknownConstants()
    {
    }
}
