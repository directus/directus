<?php

namespace Directus\Util;

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
        if (!($datetime instanceof \DateTime)) {
            $datetime = new \DateTime($datetime, new \DateTimeZone('UTC'));
        }

        if (!($targetTimeZone instanceof \DateTimeZone)) {
            $targetTimeZone = new \DateTimeZone($targetTimeZone);
        }

        $datetime->setTimeZone($targetTimeZone);

        return $datetime;
    }

    /**
     * Days left to $timestamp (date)
     *
     * @param $date
     * @param $toDate - day left to this date
     *
     * @return int
     */
    public static function daysLeft($date, $toDate = null)
    {
        if ($toDate == null) {
            $toDate = time();
        }

        if ($date instanceof \DateTime) {
            $date = $date->getTimestamp();
        }

        if ($toDate instanceof \DateTime) {
            $toDate = $toDate->getTimestamp();
        }

        $timestamp = is_int($date) ? $date : strtotime($date);
        $toDateTimestamp = is_int($toDate) ? $toDate : strtotime($toDate);
        $diff = $timestamp - $toDateTimestamp;

        if ($diff < 0) {
            $diff = 0;
        }

        $diff /= static::DAY_IN_SECONDS;

        return (int) floor($diff);
    }
}
