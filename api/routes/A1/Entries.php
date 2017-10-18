<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Exception\Http\BadRequestException;
use Directus\Services\EntriesService;
use Directus\Services\GroupsService;
use Directus\Util\ArrayUtils;

class Entries extends Route
{
    use Traits\ActivityMode;

    public function rows($table)
    {
        $entriesService = new EntriesService($this->app);
        $payload = $this->app->request()->post();
        $params = $this->app->request()->get();
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $tableGateway = new TableGateway($table, $ZendDb, $acl);
        $primaryKey = $tableGateway->primaryKeyFieldName;

        switch ($this->app->request()->getMethod()) {
            case 'POST':
                $newRecord = $entriesService->createEntry($table, $payload, $params);
                $params[$primaryKey] = ArrayUtils::get($newRecord->toArray(), $primaryKey);
                break;
            case 'PUT':
                if (!is_numeric_array($payload)) {
                    $params[$primaryKey] = ArrayUtils::get($payload, $primaryKey);
                    $payload = [$payload];
                }

                $tableGateway->updateCollection($payload);
                break;
        }

        // GET all table entries
        // If it's not a GET request, let's get entry no matter the status
        if (!$this->app->request()->isGet()) {
            $params['preview'] = true;
        }

        $response = $this->getEntriesAndSetResponseCacheTags($tableGateway, $params);

        return $this->app->response($response);
    }

    public function rowsBulk($table)
    {
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $requestPayload = $this->app->request()->post();
        $params = $this->app->request()->get();
        $rows = array_key_exists('rows', $requestPayload) ? $requestPayload['rows'] : false;
        $isDelete = $this->app->request()->isDelete();
        $deleted = false;

        if (!is_array($rows) || count($rows) <= 0) {
            throw new \Exception(__t('rows_no_specified'));
        }

        $rowIds = [];
        $tableGateway = new TableGateway($table, $ZendDb, $acl);
        $primaryKeyFieldName = $tableGateway->primaryKeyFieldName;

        // hotfix add entries by bulk
        if ($this->app->request()->isPost()) {
            $entriesService = new EntriesService($this->app);
            foreach($rows as $row) {
                $newRecord = $entriesService->createEntry($table, $row, $params);

                if (ArrayUtils::has($newRecord->toArray(), $primaryKeyFieldName)) {
                    $rowIds[] = $newRecord[$primaryKeyFieldName];
                }
            }
        } else {
            foreach ($rows as $row) {
                if (!array_key_exists($primaryKeyFieldName, $row)) {
                    throw new \Exception(__t('row_without_primary_key_field'));
                }

                array_push($rowIds, $row[$primaryKeyFieldName]);
            }

            $where = new \Zend\Db\Sql\Where;

            if ($isDelete) {
                if ($table === 'directus_groups') {
                    $groupService = new GroupsService($this->app);
                    foreach ($rowIds as $id) {
                        $group = $groupService->find($id);
                        if ($group && !$groupService->canDelete($id)) {
                            $this->app->response()->setStatus(403);

                            return $this->app->response([
                                'success' => false,
                                'error' => [
                                    'message' => sprintf('You are not allowed to delete group [%s]', $group->name)
                                ]
                            ]);
                        }
                    }
                }
                $deleted = $tableGateway->delete($where->in($primaryKeyFieldName, $rowIds));
            } else {
                foreach ($rows as $row) {
                    $tableGateway->updateCollection($row);
                }
            }
        }

        if (!empty($rowIds)) {
            $params['filters'] = [
                $primaryKeyFieldName => ['in' => $rowIds]
            ];
        }

        // If it's not a GET request, let's get entry no matter the status
        if (!$this->app->request()->isGet()) {
            $params['preview'] = true;
        }

        $entries = $this->getEntriesAndSetResponseCacheTags($tableGateway, $params);

        if ($isDelete) {
            $response = [
                'meta' => ['table' => $tableGateway->getTable(), 'ids' => $rowIds],
                'data' => ['success' => !! $deleted]
            ];
        } else {
            $response = $entries;
        }

        return $this->app->response($response);
    }

    public function typeAhead($table, $query = null)
    {
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');

        $params = $this->app->request()->get();

        $Table = new TableGateway($table, $ZendDb, $acl);

        if (!isset($params['columns'])) {
            $params['columns'] = '';
        }

        $columns = $visibleColumns = ($params['columns']) ? explode(',', $params['columns']) : [];
        ArrayUtils::push($columns, $Table->primaryKeyFieldName);
        $params['columns'] = implode(',', $columns);
        if (count($columns) > 0 && isset($params['q'])) {
            $params['adv_where'] = "`{$columns[0]}` like '%{$params['q']}%'";
            $params['perPage'] = 50;
        }

        if (!$query) {
            $entries = $this->getEntriesAndSetResponseCacheTags($Table, $params);
        }

        $entries = $entries['data'];
        $response = [];
        foreach ($entries as $entry) {
            $tokens = [];
            foreach ($visibleColumns as $col) {
                array_push($tokens, $entry[$col]);
            }

            $val = implode(' ', $tokens);
            array_push($response, [
                'value' => $val,
                'tokens' => $tokens,
                'id' => $entry[$Table->primaryKeyFieldName]
            ]);
        }

        return $this->app->response($response);
    }

    public function row($table, $id)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();
        $params = $app->request()->get();

        $params['table_name'] = $table;

        $TableGateway = TableGateway::makeTableGatewayFromTableName($table, $ZendDb, $acl);
        switch ($app->request()->getMethod()) {
            // PUT an updated table entry
            case 'PATCH':
            case 'PUT':
                $requestPayload[$TableGateway->primaryKeyFieldName] = $id;
                $TableGateway->updateRecord($requestPayload, $this->getActivityMode());
                break;
            // DELETE a given table entry
            case 'DELETE':
                if ($table === 'directus_groups') {
                    $groupService = new GroupsService($app);
                    $group = $groupService->find($id);
                    if ($group && !$groupService->canDelete($id)) {
                        $app->response()->setStatus(403);

                        return $app->response([
                            'success' => false,
                            'error' => [
                                'message' => sprintf('You are not allowed to delete group [%s]', $group->name)
                            ]
                        ]);
                    }
                }
                $condition = [
                    $TableGateway->primaryKeyFieldName => $id
                ];

                if (ArrayUtils::get($params, 'soft')) {
                    if (!$TableGateway->getTableSchema()->hasStatusColumn()) {
                        throw new BadRequestException(__t('cannot_soft_delete_missing_status_column'));
                    }

                    $success = $TableGateway->update([
                        $TableGateway->getStatusColumnName() => $TableGateway->getDeletedValue()
                    ], $condition);
                } else {
                    $success =  $TableGateway->delete($condition);
                }

                return $this->app->response([
                    'meta' => [
                        'table' => $table
                    ],
                    'success' => (bool) $success
                ]);
        }

        // GET a table entry
        $params[$TableGateway->primaryKeyFieldName] = $id;
        // If it's not a GET request, let's get entry no matter the status
        if (!$this->app->request()->isGet()) {
            $params['preview'] = true;
        }

        $response = $this->getEntriesAndSetResponseCacheTags($TableGateway, $params);

        if (!$response) {
            $response = [
                'message' => __t('unable_to_find_record_in_x_with_id_x', ['table' => $table, 'id' => $id]),
                'success' => false
            ];
        }

        return $this->app->response($response);
    }

    public function meta($table, $id)
    {
        $app = $this->app;
        $dbConnection = $app->container->get('zenddb');
        $acl = $app->container->get('acl');

        $tableGateway = new DirectusActivityTableGateway($dbConnection, $acl);

        $data = $this->getDataAndSetResponseCacheTags([$tableGateway, 'getMetadata'], [$table, $id]);

        $response = [
            'meta' => ['table' => 'directus_activity', 'type' => 'item'],
            'data' => $data
        ];

        return $this->app->response($response);
    }
}
