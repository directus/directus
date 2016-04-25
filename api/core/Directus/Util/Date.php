<?php

namespace Directus\Util;

use DateTime;
use DateTimeZone;

class Date
{
    /**
     * Seconds in a day
     *
     * @var int
     */
    const DAY_IN_SECONDS = 86400;

    /**
     * Given a date/time in UTC and a target timezone, yields a DateTime object converted from
     * UTC to the target timezone.
     *
     * @param  mixed $datetime       \DateTime instance or String.
     * @param  mized $targetTimeZone \DateTimeZone instance or String.
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
     * Days left to $timestamp (date)
     *
     * @param $toDate - days left to this date.
     * @param $fromDate - days left from this date
     *
     * @return int
     */
    public static function daysLeft($toDate, $fromDate = null)
    {
        if ($fromDate == null) {
            $fromDate = time();
        }

        if ($toDate instanceof DateTime) {
            $toDate = $toDate->getTimestamp();
        }

        if ($fromDate instanceof DateTime) {
            $fromDate = $fromDate->getTimestamp();
        }

        $toDateTimestamp = is_int($toDate) ? $toDate : strtotime($toDate);
        $fromDateTimestamp = is_int($fromDate) ? $fromDate : strtotime($fromDate);
        $diff = $toDateTimestamp - $fromDateTimestamp;

        if ($diff < 0) {
            $diff = 0;
        }

        $diff /= static::DAY_IN_SECONDS;

        return (int) floor($diff);
    }
}
