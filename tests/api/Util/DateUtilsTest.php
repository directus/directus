<?php

use Directus\Util\Date;

class DateUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testDaysLeft()
    {
        $this->assertEquals(11, Date::daysLeft(1462380876, 1461380876));
    }
}
