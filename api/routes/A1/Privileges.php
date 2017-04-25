<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Bootstrap;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Services\TablesService;
use Directus\Util\ArrayUtils;
use Directus\Util\SchemaUtils;
use Directus\View\JsonView;

class Privileges extends Route
{
    public function showPrivileges($groupId, $tableName = null)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');

        if ($acl->getGroupId() != 1) {
            throw new \Exception(__t('permission_denied'));
        }

        $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);
        $response = [
            'meta' => [
                'type' => 'item',
                'table' => 'directus_privileges'
            ],
            'data' => $privileges->fetchPerTable($groupId, $tableName)
        ];

        if (!$response['data']) {
            $app->response()->setStatus(404);
            $response = [
                'success' => false,
                'error' => [
                    'message' => __t('unable_to_find_privileges_for_x_in_group_x', ['table' => $tableName, 'group_id' => $groupId])
                ]
            ];
        }

        // @NOTE: error and success get inside data
        // @TODO: Fix response format
        return $this->app->response([
            $response
        ]);
    }

    public function createPrivileges($groupId)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();

        if ($acl->getGroupId() != 1) {
            throw new \Exception(__t('permission_denied'));
        }

        if (isset($requestPayload['addTable'])) {
            $isTableNameAlphanumeric = preg_match("/[a-z0-9]+/i", $requestPayload['table_name']);
            $zeroOrMoreUnderscoresDashes = preg_match("/[_-]*/i", $requestPayload['table_name']);

            if (!($isTableNameAlphanumeric && $zeroOrMoreUnderscoresDashes)) {
                $app->response->setStatus(400);
                return $this->app->response(['message' => __t('invalid_table_name')]);
            }

            ArrayUtils::remove($requestPayload, 'addTable');

            $tableService = new TablesService($app);
            $tableService->createTable($requestPayload['table_name'], ArrayUtils::get($requestPayload, 'columnsName'));

            ArrayUtils::remove($requestPayload, 'columnsName');
        }

        $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);
        $response = $privileges->insertPrivilege($requestPayload);

        return $this->app->response([
            'meta' => [
                'type' => 'entry',
                'table' => 'directus_privileges'
            ],
            'data' => $response
        ]);
    }

    public function updatePrivileges($groupId, $privilegeId)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();

        $requestPayload['id'] = $privilegeId;
        if ($acl->getGroupId() != 1) {
            throw new \Exception(__t('permission_denied'));
        }

        $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);

        if (isset($requestPayload['activeState'])) {
            if ($requestPayload['activeState'] !== 'all') {
                $priv = $privileges->findByStatus($requestPayload['table_name'], $requestPayload['group_id'], $requestPayload['activeState']);
                if ($priv) {
                    $requestPayload['id'] = $priv['id'];
                    $requestPayload['status_id'] = $priv['status_id'];
                } else {
                    unset($requestPayload['id']);
                    $requestPayload['status_id'] = $requestPayload['activeState'];
                    $response = $privileges->insertPrivilege($requestPayload);
                    return $this->app->response($response);
                }
            }
        }

        $response = $privileges->updatePrivilege($requestPayload);

        return $this->app->response([
            'data' => $response
        ]);
    }
}
