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
}
