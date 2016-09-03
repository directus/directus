<?php

use Directus\Util\DateUtils;

class DateUtilsTest extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        if (!ini_get('date.timezone')) {
            ini_set('date.timezone', 'America/New_York');
        }
    }

    public function testDaysLeft()
    {
        $this->assertEquals(11, DateUtils::daysLeft(1462380876, 1461380876));
        $this->assertEquals(11, DateUtils::daysLeft(gmdate('Y-m-d', 1462380876), gmdate('Y-m-d', 1461380876)));
        $this->assertEquals(18, DateUtils::daysLeft(new DateTime('2016-04-16'), new DateTime('2016-03-29')));

        // On Past dates
        $this->assertEquals(0, DateUtils::daysLeft(1461380876, 1462380876));
        $this->assertEquals(0, DateUtils::daysLeft(gmdate('Y-m-d', 1461380876), gmdate('Y-m-d', 1462380876)));
        $this->assertEquals(0, DateUtils::daysLeft(new DateTime('2016-03-29'), new DateTime('2016-04-16')));

        $this->assertEquals(-11, DateUtils::daysLeft(1461380876, 1462380876, true));
        $this->assertEquals(-11, DateUtils::daysLeft(gmdate('Y-m-d', 1461380876), gmdate('Y-m-d', 1462380876), true));
        $this->assertEquals(-18, DateUtils::daysLeft(new DateTime('2016-03-29'), new DateTime('2016-04-16'), true));

        $this->assertEquals(1, DateUtils::daysLeft(time() + DateUtils::DAY_IN_SECONDS));
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

    public function testDate()
    {
        $time = 1405267200;
        $datetime = DateUtils::date($time);
        $this->assertInternalType('string', $datetime);

        $expected = '2014-07-13 16:00:00';
        $this->assertEquals($expected, $datetime);

        $datetime = DateUtils::date($time, '+1 days');
        $expected = '2014-07-14 16:00:00';
        $this->assertEquals($expected, $datetime);

        $datetime = DateUtils::date($time, '+1 days', 'Y-m-d');
        $expected = '2014-07-14';
        $this->assertEquals($expected, $datetime);
    }

    public function testNow()
    {
        $datetime = DateUtils::now();
        $this->assertInternalType('string', $datetime);
    }

    public function testAgo()
    {
        $datetime = DateUtils::daysAgo(1, 1405267200);
        $this->assertInternalType('string', $datetime);

        $expected = '2014-07-12 16:00:00';
        $this->assertEquals($expected, $datetime);
    }

    public function testFutureDate()
    {
        $datetime = DateUtils::inDays(1, 1405267200);
        $this->assertInternalType('string', $datetime);

        $expected = '2014-07-14 16:00:00';
        $this->assertEquals($expected, $datetime);
    }

    public function testISO()
    {
        $time = 1405267200;
        $expected = '2014-07-13T16:00:00+00:00';

        $datetime = DateUtils::date($time);
        $isoDatetime = DateUtils::convertToISOFormat($datetime);
        $this->assertEquals($expected, $isoDatetime);

        $isoDatetime = DateUtils::convertToISOFormat($time);
        $this->assertEquals($expected, $isoDatetime);

        $expected = '2014-07-13T12:00:00-04:00';
        $isoDatetime = DateUtils::convertToISOFormat($time, 'UTC', 'America/Santo_Domingo');
        $this->assertEquals($expected, $isoDatetime);
    }

    public function testPassed()
    {
        $datetime = new DateTime('now');

        $datetime->modify('-1 days');
        $this->assertTrue(DateUtils::hasPassed($datetime));

        $datetime->modify('2 days');
        $this->assertFalse(DateUtils::hasPassed($datetime));


        $datetime->modify('-3 days');
        $this->assertTrue(DateUtils::hasPassed($datetime->format('Y-m-d H:i:s')));

        $datetime->modify('4 days');
        $this->assertFalse(DateUtils::hasPassed($datetime->format('Y-m-d H:i:s')));
    }
}
