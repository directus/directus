<?php

namespace Directus\API\Routes\A1;

use Directus\Database\Exception\TableAlreadyExistsException;
use Directus\Database\Object\Column;
use Directus\Database\TableGateway\DirectusTablesTableGateway;
use Directus\Permissions\Acl;
use Directus\Permissions\Exception\UnauthorizedTableAlterException;
use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Services\ColumnsService;
use Directus\Services\TablesService;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Predicate\In;

class Table extends Route
{
    public function create()
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();
        $tableName = ArrayUtils::get($requestPayload, 'name');
        $systemColumns = ArrayUtils::get($requestPayload, 'columns', []);

        if ($acl->getGroupId() != 1) {
            throw new \Exception(__t('permission_denied'));
        }

        $tableService = new TablesService($app);

        try {
            $tableService->createTable($tableName, $systemColumns);
        } catch (TableAlreadyExistsException $e) {
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => __t('table_x_already_exists', [
                        'table_name' => $tableName
                    ])
                ]
            ]);
        }

        $privilegesTableGateway = new DirectusPrivilegesTableGateway($ZendDb, $acl);
        $privileges = array_merge(Acl::PERMISSION_FULL, [
            'table_name' => $tableName,
            'nav_listed' => 1,
            'status_id' => null,
            'group_id' => 1
        ]);

        $privilegesTableGateway->insertPrivilege($privileges);
        $acl->setTablePrivileges($tableName, $privileges);

        return $this->info($tableName);
    }

    public function columns($tableName)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();
        $params = $app->request()->get();

        if ($app->request()->isPatch()) {
            return $this->patchColumns($tableName, $requestPayload);
        }

        $params['table_name'] = $tableName;
        if ($app->request()->isPost()) {
            /**
             * @todo  check if a column by this name already exists
             * @todo  build this into the method when we shift its location to the new layer
             */
            if (!$acl->hasTablePrivilege($tableName, 'alter')) {
                throw new UnauthorizedTableAlterException(__t('permission_table_alter_access_forbidden_on_table', [
                    'table_name' => $tableName
                ]));
            }

            $columnService = new ColumnsService($app);
            $params['column_name'] = $columnService->addColumn($tableName, $requestPayload);
            $response = [
                'meta' => ['type' => 'item', 'table' => 'directus_columns'],
                // Fetch column skipping cache
                // New columns are not cached
                'data' => TableSchema::getColumnSchema($tableName, $params['column_name'], true)->toArray()
            ];
        } else {

            $this->tagResponseCache('tableColumnsSchema_'.$tableName);
            $response = [
                'meta' => ['type' => 'collection', 'table' => 'directus_columns'],
                'data' => array_map(function(Column $column) {
                    return $column->toArray();
                }, TableSchema::getTableColumnsSchema($tableName))
            ];
        }

        return $this->app->response($response);
    }

    public function column($table, $column)
    {
        $app = $this->app;
        $requestPayload = $app->request()->post();
        $params = $app->request()->get();
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');

        if ($app->request()->isDelete()) {
            $tableGateway = new TableGateway($table, $ZendDb, $acl);
            // NOTE: make sure to check aliases column (Ex: M2M Columns)
            $tableObject = TableSchema::getTableSchema($table, [], false, true);
            $hasColumn = $tableObject->hasColumn($column);
            $hasMoreThanOneColumn = count($tableObject->getColumns()) > 1;
            $success = false;

            if ($hasColumn && $hasMoreThanOneColumn) {
                $success = $tableGateway->dropColumn($column);
            }

            $response = [
                'meta' => [
                    'table' => $tableGateway->getTable(),
                    'column' => $column
                ],
                'success' => $success
            ];

            // TODO: implement successful messages
            if (!$success) {
                if (!$hasMoreThanOneColumn) {
                    $errorMessage = __t('cannot_remove_last_column');
                } else if (!$hasColumn) {
                    $errorMessage = __t('unable_to_find_column_X_in_table_y', [
                        'table' => $table,
                        'column' => $column
                    ]);
                } else {
                    $errorMessage = __t('unable_to_remove_column_x', [
                        'column_name' => $column
                    ]);
                }

                $response['error']['message'] = $errorMessage;
            }

            return $this->app->response($response);
        }

        $params['column_name'] = $column;
        $params['table_name'] = $table;
        // This `type` variable is used on the client-side
        // Not need on server side.
        // @TODO: We should probably stop using it on the client-side
        unset($requestPayload['type']);
        // Add table name to dataset. @TODO more clarification would be useful
        // Also This would return an Error because of $row not always would be an array.
        if ($requestPayload) {
            foreach ($requestPayload as &$row) {
                if (is_array($row)) {
                    $row['table_name'] = $table;
                }
            }
        }

        if ($app->request()->isPut() || $app->request()->isPatch()) {
            $columnsService = new ColumnsService($this->app);
            $columnsService->update($table, $column, $requestPayload, $app->request()->isPatch());
        }

        $this->tagResponseCache(['tableColumnsSchema_'.$table, 'columnSchema_'.$table.'_'.$column]);
        $response = TableSchema::getColumnSchema($table, $column, true);
        if (!$response) {
            $response = [
                'error' => [
                    'message' => __t('unable_to_find_column_x', ['column' => $column])
                ],
                'success' => false
            ];
        } else {
            $response = [
                'data' => $response,
                'meta' => [
                    'type' => 'collection',
                    'table' => 'directus_columns'
                ]
            ];
        }

        return $this->app->response($response);
    }

    public function postColumn($table, $column)
    {
        $container = $this->app->container;
        $ZendDb = $container->get('zenddb');
        $acl = $container->get('acl');
        $requestPayload = $this->app->request()->post();
        $TableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
        $data = $requestPayload;

        // @TODO: check whether this condition is still needed
        if (isset($data['type'])) {
            $data['data_type'] = $data['type'];
            $data['relationship_type'] = $data['type'];
            unset($data['type']);
        }

        $data['column_name'] = $column;
        $data['table_name'] = $table;
        $row = $TableGateway->findOneByArray(['table_name' => $table, 'column_name' => $column]);

        if ($row) {
            $data['id'] = $row['id'];
        }

        $this->invalidateCacheTags(['tableColumnsSchema_'.$table, 'columnSchema_'.$table.'_'.$column]);
        $newRecord = $TableGateway->updateRecord($data, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);

        return $this->app->response($newRecord);
    }

    // get all table names
    public function names()
    {
        $params = $this->app->request()->get();
        $tables = TableSchema::getTablenames($params);

        // @TODO: Add more directus_table information
        $response = [
            'meta' => [
                'type' => 'collection',
                'table' => 'directus_tables'
            ],
            'data' => $tables
        ];

        return $this->app->response($response);
    }

    // get a single table information
    public function info($table)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();

        if ($app->request()->isDelete()) {
            // NOTE: similar code to unmanage table in Table::stopManaging
            $tableService = new TablesService($app);
            $success = $tableService->dropTable($table);

            $response = [
                'error' => [
                    'message' => __t('unable_to_remove_table_x', ['table_name' => $table])
                ],
                'success' => false
            ];

            if ($success) {
                unset($response['error']);
                $response['success'] = true;
                $response['data']['message'] = __t('table_x_was_removed');
            }

            return $this->app->response($response);
        }

        $TableGateway = new DirectusTablesTableGateway($ZendDb, $acl);

        /* PUT updates the table */
        if ($app->request()->isPut() || $app->request()->isPatch()) {
            $data = $requestPayload;
            $data['table_name'] = $table;

            if ($app->request()->isPut()) {
                $table_settings = [
                    'table_name' => $data['table_name'],
                    'hidden' => (int)$data['hidden'],
                    'single' => (int)$data['single'],
                    'footer' => (int)$data['footer'],
                    'primary_column' => array_key_exists('primary_column', $data) ? $data['primary_column'] : ''
                ];
            } else {
                $table_settings = ArrayUtils::omit($data, 'columns');
            }

            //@TODO: Possibly pretty this up so not doing direct inserts/updates
            $set = $TableGateway->select(['table_name' => $table])->toArray();

            //If item exists, update, else insert
            if (count($set) > 0) {
                $TableGateway->update($table_settings, ['table_name' => $table]);
            } else {
                $TableGateway->insert($table_settings);
            }
        }

        $this->tagResponseCache(['tableSchema_'.$table, 'table_directus_columns']);
        $response = TableSchema::getTable($table);

        if (!$response) {
            $response = [
                'error' => [
                    'message' => __t('unable_to_find_table_x', ['table_name' => $table])
                ],
                'success' => false
            ];
        } else {
            $response = [
                'success' => true,
                'meta' => [
                    'type' => 'entry',
                    'table' => 'directus_tables'
                ],
                'data' => $response
            ];
        }

        return $this->app->response($response);
    }

    public function unmanage($table)
    {
        $app = $this->app;
        $dbConnection = $app->container->get('zenddb');
        $acl = $app->container->get('acl');

        // NOTE: Similar code in delete table Table::info
        $tableGateway = new TableGateway($table, $dbConnection, $acl);
        $success = $tableGateway->stopManaging();

        $response = [
            'error' => [
                'message' => __t('unable_to_remove_table_x', ['table_name' => $table])
            ],
            'success' => false
        ];

        if ($success) {
            unset($response['error']);
            $response['success'] = true;
            $response['data']['message'] = __t('table_x_was_removed', ['table_name' => $table]);
        }

        return $this->app->response($response);
    }

    public function columnUi($table, $column, $ui)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $tableGateway = new TableGateway('directus_columns', $ZendDb, $acl);

        switch ($app->request()->getMethod()) {
            case 'PUT':
            case 'POST':
            $payload = $app->request()->post();

            $columnData = $tableGateway->select([
                'table_name' => $table,
                'column_name' => $column
            ])->current();

            if ($columnData) {
                $columnData = $columnData->toArray();

                $data = [
                    'id' => $columnData['id'],
                    'options' => json_encode($payload)
                ];

                $tableGateway->updateCollection($data);
            }
        }

        $select = $tableGateway->getSql()->select();
        $select->columns(['id', 'options']);
        $select->where([
            'table_name' => $table,
            'column_name' => $column
        ]);

        $response = $this->getDataAndSetResponseCacheTags(
            [$tableGateway, 'selectWith'],
            [$select]
        )->current();

        if (!$response) {
            $app->response()->setStatus(404);
            $response = [
                'message' => __t('unable_to_find_column_x_options_for_x', ['column' => $column, 'ui' => $ui]),
                'success' => false
            ];
        } else {
            $data = $response->toArray();

            $response = [
                'meta' => ['table' => 'directus_columns', 'type' => 'item'],
                'data' => json_decode($data['options'], true)
            ];
        }

        return $this->app->response($response);
    }

    protected function patchColumns($table, $payload)
    {
        $container = $this->app->container;
        $ZendDb = $container->get('zenddb');
        $acl = $container->get('acl');
        $TableGateway = new TableGateway('directus_columns', $ZendDb, $acl);

        $rows = array_key_exists('rows', $payload) ? $payload['rows'] : false;
        if (!is_array($rows) || count($rows) <= 0) {
            throw new \Exception(__t('rows_no_specified'));
        }

        $columnNames = [];
        foreach ($rows as $row) {
            $column = $row['id'];
            $columnNames[] = $column;
            unset($row['id']);

            $condition = [
                'table_name' => $table,
                'column_name' => $column
            ];

            if ($row) {
                // check if the column data exists in `directus_columns`
                $columnInfo = $TableGateway->select($condition);
                if ($columnInfo->count() === 0) {
                    // add the column information into `directus_columns`
                    $columnInfo = TableSchema::getColumnSchema($table, $column);
                    $columnInfo = $columnInfo->toArray();
                    $columnsName = TableSchema::getAllTableColumnsName('directus_columns');
                    // NOTE: the column name name is data_type in the database
                    // but the attribute in the object is type
                    // change the name to insert the data type value into the columns table
                    ArrayUtils::rename($columnInfo, 'type', 'data_type');
                    $columnInfo = ArrayUtils::pick($columnInfo, $columnsName);
                    // NOTE: remove the column id info
                    // this information is the column name
                    // not the record id in the database
                    ArrayUtils::remove($columnInfo, ['id', 'options']);
                    $TableGateway->insert($columnInfo);
                }

                $TableGateway->update($row, $condition);
            }
        }

        $rows = $TableGateway->select([
           'table_name' => $table,
            new In('column_name', $columnNames)
        ]);

        $response = [
            'meta' => [
                'table' => 'directus_columns',
                'type' => 'collection'
            ],
            'data' => $rows->toArray()
        ];

        return $this->app->response($response);
    }
}
