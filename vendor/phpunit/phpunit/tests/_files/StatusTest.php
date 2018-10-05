<?php
class StatusTest extends \PHPUnit\Framework\TestCase
{
    public function testSuccess()
    {
        $this->assertTrue(true);
    }

    public function testFailure()
    {
        $this->assertTrue(false);
    }

    public function testError()
    {
        throw new \Exception;
    }

    public function testIncomplete()
    {
        $this->markTestIncomplete();
    }

    public function testSkipped()
    {
        $this->markTestSkipped();
    }

    public function testRisky()
    {
    }

    public function testWarning()
    {
        throw new PHPUnit_Framework_Warning;
    }
}
