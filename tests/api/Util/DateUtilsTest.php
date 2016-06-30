<?php

use Directus\Util\DateUtils;

class DateUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testDaysLeft()
    {
        $this->assertEquals(11, DateUtils::daysLeft(1462380876, 1461380876));
        $this->assertEquals(11, DateUtils::daysLeft(Date('Y-m-d', 1462380876), Date('Y-m-d', 1461380876)));
        $this->assertEquals(18, DateUtils::daysLeft(new DateTime('2016-04-16'), new DateTime('2016-03-29')));

        // On Past dates
        $this->assertEquals(0, DateUtils::daysLeft(1461380876, 1462380876));
        $this->assertEquals(0, DateUtils::daysLeft(Date('Y-m-d', 1461380876), Date('Y-m-d', 1462380876)));
        $this->assertEquals(0, DateUtils::daysLeft(new DateTime('2016-03-29'), new DateTime('2016-04-16')));

        $this->assertEquals(-11, DateUtils::daysLeft(1461380876, 1462380876, true));
        $this->assertEquals(-11, DateUtils::daysLeft(Date('Y-m-d', 1461380876), Date('Y-m-d', 1462380876), true));
        $this->assertEquals(-18, DateUtils::daysLeft(new DateTime('2016-03-29'), new DateTime('2016-04-16'), true));

        $this->assertEquals(1, DateUtils::daysLeft(time()+DateUtils::DAY_IN_SECONDS));
    }

    public function testConvertUTCDateTimezone()
    {
        $time = '2016-06-28 16:13:18';
        $timezone = 'America/New_York';
        $result = DateUtils::convertUtcDateTimeToTimeZone($time, $timezone);

        $this->assertInstanceOf('\DateTime', $result);
        $this->assertEquals('2016-06-28 12:13:18', $result->format('Y-m-d H:i:s'));

        $dateTime = new \DateTime($time, new DateTimeZone('UTC'));
        $dateTimeZone = new \DateTimeZone($timezone);

        $result = DateUtils::convertUtcDateTimeToTimeZone($dateTime, $dateTimeZone);

        $this->assertInstanceOf('\DateTime', $result);
        $this->assertEquals('2016-06-28 12:13:18', $result->format('Y-m-d H:i:s'));
    }
}
