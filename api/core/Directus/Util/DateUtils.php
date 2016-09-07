<?php

namespace Directus\Util;

use DateTime;
use DateTimeZone;

class DateUtils
{
    /**
     * Seconds in a day
     *
     * @var int
     */
    const DAY_IN_SECONDS = 86400;

    /**
     * DateTime modifier format days into the future
     *
     * @var string
     */
    const IN_DAYS = '+%s days';

    /**
     * DateTime modifier format days ago
     *
     * @var string
     */
    const DAYS_AGO = '-%s days';

    /**
     * Get the current date in $format and modified by $modify
     *
     * @param string $time
     * @param null $modify
     * @param string $format
     *
     * @return string
     */
    public static function date($time = null, $modify = null, $format = 'Y-m-d H:i:s')
    {
        if ($time == null) {
            $time = time();
        }

        $datetime = new DateTime();
        $datetime->setTimestamp($time);
        $datetime->setTimezone(new DateTimeZone('UTC'));

        if ($modify != null) {
            $datetime->modify($modify);
        }

        return $datetime->format($format);
    }

    /**
     * Get the current time in UTC
     *
     * @return string
     */
    public static function now()
    {
        return static::date();
    }

    /**
     * Get a date in $days into the future from current time UTC
     *
     * @param $days
     * @param $time
     *
     * @return string
     */
    public static function inDays($days, $time = null)
    {
        return static::date($time, sprintf(static::IN_DAYS, $days));
    }

    /**
     * Get a date $days ago from current time UTC
     *
     * @param $days
     * @param $time
     *
     * @return string
     */
    public static function daysAgo($days, $time = null)
    {
        return static::date($time, sprintf(static::DAYS_AGO, $days));
    }

    /**
     * Given a date/time in UTC and a target timezone, yields a DateTime object converted from
     * UTC to the target timezone.
     *
     * @param  mixed $datetime \DateTime instance or String.
     * @param  mixed $targetTimeZone \DateTimeZone instance or String.
     *
     * @return \DateTime
     */
    public static function convertUtcDateTimeToTimeZone($datetime, $targetTimeZone)
    {
        if (!($datetime instanceof DateTime)) {
            $datetime = new DateTime($datetime, new DateTimeZone('UTC'));
        }

        if (!($targetTimeZone instanceof DateTimeZone)) {
            $targetTimeZone = new DateTimeZone($targetTimeZone);
        }

        $datetime->setTimeZone($targetTimeZone);

        return $datetime;
    }

    /**
     * Convert date into ISO 8601 Format.
     *
     * @param $datetime
     * @param string $datetimezone - $datetime timezone
     * @param string $isotimezone - timezone for the result date
     *
     * @return null|string
     */
    public static function convertToISOFormat($datetime, $datetimezone = 'UTC', $isotimezone = 'UTC')
    {
        if (!($datetime instanceof DateTime)) {
            $format = is_int($datetime) ? 'U' : 'Y-m-d H:i:s';
            $datetime = DateTime::createFromFormat($format, $datetime, new DateTimeZone($datetimezone));
        }

        $date = null;
        if ($datetime) {
            $datetime->setTimezone(new DateTimeZone($isotimezone));
            $date = $datetime->format('c');
        }

        return $date;
    }

    /**
     * Days left to $timestamp (date)
     *
     * @param $toDate - days left to this date.
     * @param $fromDate - days left from this date
     * @param $negativeDiff - Returns negative value or zero if diff is negative
     *
     * @return int
     */
    public static function daysLeft($toDate, $fromDate = null, $negativeDiff = false)
    {
        if (!($toDate instanceof DateTime)) {
            $toDateTimestamp = is_int($toDate) ? $toDate : strtotime($toDate);
            $toDate = new DateTime();
            $toDate->setTimestamp($toDateTimestamp);
        }

        if ($fromDate == null) {
            $fromDate = new DateTime();
            $fromDate->setTimestamp(time());
        } else if (!($fromDate instanceof DateTime)) {
            $fromDateTimestamp = is_int($fromDate) ? $fromDate : strtotime($fromDate);
            $fromDate = new DateTime();
            $fromDate->setTimestamp($fromDateTimestamp);
        }

        $intervalDate = $fromDate->diff($toDate);
        $diff = $intervalDate->format('%r%a');

        if (!$negativeDiff && $diff < 0) {
            $diff = 0;
        }

        return $diff;
    }

    /**
     * Determine if a given date time has passed UTC
     *
     * @param $datetime
     *
     * @return bool
     */
    public static function hasPassed($datetime)
    {
        if (!($datetime instanceof DateTime)) {
            $datetime = new DateTime($datetime, new DateTimeZone('UTC'));
        }

        $currentDateTime = new DateTime(static::now());

        return $currentDateTime > $datetime;
    }
}
