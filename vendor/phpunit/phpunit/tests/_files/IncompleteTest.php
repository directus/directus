<?php
class IncompleteTest extends PHPUnit_Framework_TestCase
{
    public function testIncomplete()
    {
        $this->markTestIncomplete('Test incomplete');
    }
}
