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
}
