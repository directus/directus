<?php
class ChangeCurrentWorkingDirectoryTest extends PHPUnit_Framework_TestCase
{
    public function testSomethingThatChangesTheCwd()
    {
        chdir('../');
        $this->assertTrue(true);
    }
}
