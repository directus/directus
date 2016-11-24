<?php

namespace Directus\Services;

use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;

class EntriesService extends AbstractService
{
    public function createEntry($table, $payload, $params = [])
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');

        $id = null;
        $params['table_name'] = $table;
        $TableGateway = new TableGateway($table, $ZendDb, $acl);

        // any CREATE requests should md5 the email
        if ('directus_users' === $table &&
            in_array($app->request()->getMethod(), ['POST']) &&
            array_key_exists('email', $payload)
        ) {
            $avatar = DirectusUsersTableGateway::get_avatar($payload['email']);
            $payload['avatar'] = $avatar;
        }

        $activityLoggingEnabled = !(isset($params['skip_activity_log']) && (1 == $params['skip_activity_log']));
        $activityMode = $activityLoggingEnabled ? TableGateway::ACTIVITY_ENTRY_MODE_PARENT : TableGateway::ACTIVITY_ENTRY_MODE_DISABLED;

        $newRecord = $TableGateway->manageRecordUpdate($table, $payload, $activityMode);

        return $newRecord;
    }
}