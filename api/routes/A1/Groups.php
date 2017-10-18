<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Services\GroupsService;
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
                $newRecord = $GroupsTableGateway->updateRecord($requestPayload);
                $newGroupId = $newRecord['id'];
                $response = $GroupsTableGateway->getEntries(['id' => $newGroupId]);
                break;
            case 'GET':
            default:
                $response = $this->getEntriesAndSetResponseCacheTags($GroupsTableGateway, $params);
        }

        return $this->app->response($response);
    }

    public function group($id)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $params = $app->request()->get();
        $params['id'] = $id;

        // @TODO need POST and PUT
        $tableName = 'directus_groups';
        $Groups = new TableGateway($tableName, $ZendDb, $acl);
        $response = $this->getEntriesAndSetResponseCacheTags($Groups, $params);
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

        $newRecord = $tableGateway->updateRecord($requestPayload);
        $newGroupId = $newRecord['id'];
        $response = $this->getEntriesAndSetResponseCacheTags($tableGateway, ['id' => $newGroupId]);

        return $this->app->response($response);
    }

    public function deleteGroup($id)
    {
        $app = $this->app;
        $groupService = new GroupsService($app);

        $group = $groupService->find($id);
        if (!$group) {
            $app->response()->setStatus(404);

            return $app->response([
                'success' => false,
                'error' => [
                    'message' => sprintf('Group [%d] not found', $id)
                ]
            ]);
        }

        if (!$groupService->canDelete($id)) {
            $app->response()->setStatus(403);

            return $app->response([
                'success' => false,
                'error' => [
                    'message' => sprintf('You are not allowed to delete group [%s]', $group->name)
                ]
            ]);
        }

        return $app->response([
            'success' => (bool) $groupService->getTableGateway()->delete(['id' => $id])
        ]);
    }
}
