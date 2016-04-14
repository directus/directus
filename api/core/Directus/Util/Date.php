<?php

namespace Directus\Util;

class Date
{
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
     * @param $timestamp
     *
     * @return int
     */
    public static function daysLeft($timestamp)
    {
        $timestamp = is_int($timestamp) ? $timestamp : strtotime($timestamp);
        $diff = $timestamp - time();

        if ($diff < 0) {
            $diff = 0;
        }

        $diff /= (60*60*24);

        return floor($diff);
    }
}
