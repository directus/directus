<?php
class Issue244Test extends PHPUnit_Framework_TestCase
{
    /**
     * @expectedException Issue244Exception
     * @expectedExceptionCode 123StringCode
     */
    public function testWorks()
    {
        throw new Issue244Exception;
    }

    /**
     * @expectedException Issue244Exception
     * @expectedExceptionCode OtherString
     */
    public function testFails()
    {
        throw new Issue244Exception;
    }

    /**
     * @expectedException Issue244Exception
     * @expectedExceptionCode 123
     */
    public function testFailsTooIfExpectationIsANumber()
    {
        throw new Issue244Exception;
    }

    /**
     * @expectedException Issue244ExceptionIntCode
     * @expectedExceptionCode 123String
     */
    public function testFailsTooIfExceptionCodeIsANumber()
    {
        throw new Issue244ExceptionIntCode;
    }
}

class Issue244Exception extends Exception
{
    public function __construct()
    {
        $this->code = '123StringCode';
    }
}

class Issue244ExceptionIntCode extends Exception
{
    public function __construct()
    {
        $this->code = 123;
    }
}
