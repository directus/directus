<?php
/**
 * @author Jean Carlo Machado <contato@jeancarlomachado.com.br>
 */
class Test extends PHPUnit_Framework_TestCase
{
    public function testOne()
    {
        $this->expectExceptionMessage('message');

        throw new Exception('message');
    }

    public function testTwo()
    {
        $this->expectExceptionCode(123);

        throw new Exception('message', 123);
    }
}
