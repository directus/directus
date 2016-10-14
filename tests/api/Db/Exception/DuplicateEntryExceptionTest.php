<?php

class DuplicateEntryExceptionTest extends PHPUnit_Framework_TestCase
{
    public function testExceptionMessage()
    {
        $message = "Duplicate entry 'admin@local.dev' for key 'unique_email'";
        $expected = 'Duplicate value: admin@local.dev<br>(unique_email)';

        $exception = new \Directus\Database\Exception\DuplicateEntryException($message);

        $this->assertSame($expected, $exception->getMessage());
    }
}
