<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Directus\View\JsonView;

class Groups extends Route
{
    public function groups()
    {
        $app = $this->app;
        $container = $app->container;
        $acl = $container->get('acl');
        $ZendDb = $container->get('zenddb');
        $requestPayload = $app->request()->post();
        $params = $this->app->request()->get();

        // @TODO need PUT
        $tableName = 'directus_groups';
        $GroupsTableGateway = new TableGateway($tableName, $ZendDb, $acl);

        switch ($app->request()->getMethod()) {
            case 'POST':
                $newRecord = $GroupsTableGateway->manageRecordUpdate($tableName, $requestPayload);
                $newGroupId = $newRecord['id'];
                $response = $GroupsTableGateway->getEntries(['id' => $newGroupId]);
                break;
            case 'GET':
            default:
                $response = $GroupsTableGateway->getEntries($params);
        }

        return $this->app->response($response);
    }

    public function group($id)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');

        // @TODO need POST and PUT
        $tableName = 'directus_groups';
        $Groups = new TableGateway($tableName, $ZendDb, $acl);
        $response = $Groups->getEntries(['id' => $id]);
        if (!$response) {
            $response = [
                'message' => __t('unable_to_find_group_with_id_x', ['id' => $id]),
                'success' => false
            ];
        }

        return $this->app->response($response);
    }

    public function patchGroup($id)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $dbConnection = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();

        $tableName = 'directus_groups';
        $tableGateway = new TableGateway($tableName, $dbConnection, $acl);
        $requestPayload['id'] = $id;

        ArrayUtils::remove($requestPayload, 'permissions');
        $users = ArrayUtils::get($requestPayload, 'users', []);
        if ($users) {
            $users = array_filter($users, function ($user) {
                return ArrayUtils::has($user, 'id');
            });

            foreach ($users as &$user) {
                $user = ArrayUtils::pick($user, ['id', 'group']);
            }

            $requestPayload['users'] = $users;
        }

        $newRecord = $tableGateway->manageRecordUpdate($tableName, $requestPayload);
        $newGroupId = $newRecord['id'];
        $response = $tableGateway->getEntries(['id' => $newGroupId]);

        return $this->app->response($response);
    }

    public function deleteGroup($id)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $dbConnection = $app->container->get('zenddb');

        $tableGateway = new DirectusGroupsTableGateway($dbConnection, $acl);

        $success = false;
        if ($id != 1) {
            $success = $tableGateway->delete(['id' => $id]);
        } else {
            $success = true;
        }

        return $app->response([
            'success' => (bool) $success
        ]);
    }
}
