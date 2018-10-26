<?php
class Issue74Test extends PHPUnit_Framework_TestCase
{
    public function testCreateAndThrowNewExceptionInProcessIsolation()
    {
        require_once __DIR__ . '/NewException.php';
        throw new NewException('Testing GH-74');
    }
}
