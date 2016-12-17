<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
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

        // @TODO need PUT
        $tableName = 'directus_groups';
        $GroupsTableGateway = new TableGateway($tableName, $ZendDb, $acl);

        switch ($app->request()->getMethod()) {
            case 'POST':
                $newRecord = $GroupsTableGateway->manageRecordUpdate($tableName, $requestPayload);
                $newGroupId = $newRecord['id'];
                $newGroup = $GroupsTableGateway->find($newGroupId);
                $outputData = $newGroup;
                break;
            case 'GET':
            default:
                $get_new = $GroupsTableGateway->getEntries();
                $outputData = $get_new;
        }

        $outputData = [
            'meta' => [
                'type' => 'entry',
                'table' => $GroupsTableGateway->getTable()
            ],
            'data' => $outputData
        ];

        JsonView::render($outputData);
    }

    public function group($id)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');

        // @TODO need POST and PUT
        // Hardcoding ID temporarily
        is_null($id) ? $id = 1 : null;
        $tableName = 'directus_groups';
        $Groups = new TableGateway($tableName, $ZendDb, $acl);
        $response = $Groups->find($id);
        if (!$response) {
            $response = [
                'message' => __t('unable_to_find_group_with_id_x', ['id' => $id]),
                'success' => false
            ];
        }

        $columns = TableSchema::getAllNonAliasTableColumns($tableName);
        $schemaManager = $this->app->container->get('schemaManager');
        $response = $schemaManager->parseRecordValuesByType($response, $columns);
        // $response = SchemaManager::parseRecordValuesByType($response, $columns);

        JsonView::render($response);
    }
}