<?php

use Directus\Util\Validator;

class ValidatorTest extends PHPUnit_Framework_TestCase
{
    public function testEmail()
    {
        $this->assertTrue(Validator::email('admin@admin.com'));
        $this->assertTrue(Validator::email('admin@admin.com.do'));
        $this->assertTrue(Validator::email('admin@admin-dos.com'));
        $this->assertTrue(Validator::email('admin-two@admin.com'));
        $this->assertFalse(Validator::email('admin@admin'));
        $this->assertFalse(Validator::email('admin.admin.com'));
    }
}
