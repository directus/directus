<?php
namespace Directus\Customs\Cron;

interface CronJob {

    /**
     * @return int minutes
     * Execute every X defined minutes
     * eg:
     *  1 = Exceute every minute
     *  60 = Run once every hour
     *  60*2 = 120 = Run once every other hour
     *  60*12 = 1440 = Run once per day
     *  1440*2 = 2880 = Run once every other day
     *  1440*7 = 10080 = Run once every week
     */
    public static function executeEvery();

    /**
     * Function to be called when cron executes
     */
    public function exec($container);
}