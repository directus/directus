<?php
namespace Directus\Customs\Cron;
if (!interface_exists('Directus\Customs\Cron\CronJob')) die;

use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Zend\Db\TableGateway\TableGateway;

class Example implements CronJob {
    public static function executeEvery() {
        /* Once per day */
        return 1440;
    }

    public function exec($container) {
        $log = $container->get('log');
        $ZendDb = $container->get('zendDb');

        if (!$ZendDb) throw new \Exception('Missing adapter');

        /**
         * Permantly removes deleted users from the database in order to be compliant with User Privacy
         */
        $usersTG = new TableGateway('directus_users', $ZendDb, new RowGatewayFeature('id'));
        $result = $usersTG->select(['status' => 0]);

        foreach ($result as $row) {
            $id = $row['id'];
            $row->delete();
            $log->info("Removed user ");
        }
    }
}