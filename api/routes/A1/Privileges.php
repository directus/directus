<?php

namespace Directus\API\Routes\A1;

use Directus\Bootstrap;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Application\Route;
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
        return JsonView::render([
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
                return JsonView::render(['message' => __t('invalid_table_name')]);
            }

            unset($requestPayload['addTable']);

            $schema = Bootstrap::get('schemaManager');
            if (!$schema->tableExists($requestPayload['table_name'])) {
                $app->emitter->run('table.create:before', $requestPayload['table_name']);
                // Through API:
                // Remove spaces and symbols from table name
                // And in lowercase
                $requestPayload['table_name'] = SchemaUtils::cleanTableName($requestPayload['table_name']);
                $schema->createTable($requestPayload['table_name']);
                $app->emitter->run('table.create', $requestPayload['table_name']);
                $app->emitter->run('table.create:after', $requestPayload['table_name']);
            }
        }

        $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);
        $response = $privileges->insertPrivilege($requestPayload);

        return JsonView::render([
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
                    return JsonView::render($response);
                }
            }
        }

        $response = $privileges->updatePrivilege($requestPayload);

        return JsonView::render([
            'data' => $response
        ]);
    }
}