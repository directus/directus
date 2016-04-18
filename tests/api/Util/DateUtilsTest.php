<?php

use Directus\Util\Date as DateUtils;

class DateUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testDaysLeft()
    {
        $this->assertEquals(11, DateUtils::daysLeft(1462380876, 1461380876));
        $this->assertEquals(11, DateUtils::daysLeft(Date('Y-m-d', 1462380876), Date('Y-m-d', 1461380876)));
        $this->assertEquals(18, DateUtils::daysLeft(new DateTime('2016-04-16'), new DateTime('2016-03-29')));
    }
}
