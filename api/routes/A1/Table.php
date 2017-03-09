<?php

namespace Directus\API\Routes\A1;

use Directus\Database\Object\Column;
use Directus\Database\TableGateway\DirectusTablesTableGateway;
use Directus\Permissions\Exception\UnauthorizedTableAlterException;
use Directus\Application\Route;
use Directus\Bootstrap;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Directus\Util\SchemaUtils;
use Zend\Db\Sql\Predicate\In;

class Table extends Route
{
    public function create()
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();

        if ($acl->getGroupId() != 1) {
            throw new \Exception(__t('permission_denied'));
        }

        $isTableNameAlphanumeric = preg_match("/[a-z0-9]+/i", $requestPayload['name']);
        $zeroOrMoreUnderscoresDashes = preg_match("/[_-]*/i", $requestPayload['name']);

        if (!($isTableNameAlphanumeric && $zeroOrMoreUnderscoresDashes)) {
            $app->response->setStatus(400);
            return $this->app->response(['message' => __t('invalid_table_name')]);
        }

        $schema = Bootstrap::get('schemaManager');
        if ($schema->tableExists($requestPayload['name'])) {
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => sprintf('table_%s_exists', $requestPayload['name'])
                ]
            ]);
        }

        $app->emitter->run('table.create:before', $requestPayload['name']);
        // Through API:
        // Remove spaces and symbols from table name
        // And in lowercase
        $requestPayload['name'] = SchemaUtils::cleanTableName($requestPayload['name']);
        $schema->createTable($requestPayload['name']);
        $app->emitter->run('table.create', $requestPayload['name']);
        $app->emitter->run('table.create:after', $requestPayload['name']);

        $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);
        $response = $privileges->insertPrivilege([
            'nav_listed' => 1,
            'status_id' => 0,
            'allow_view' => 2,
            'allow_add' => 1,
            'allow_edit' => 2,
            'allow_delete' => 2,
            'allow_alter' => 1
        ]);

        return $this->info($requestPayload['name']);
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

            $tableGateway = new TableGateway($tableName, $ZendDb, $acl);
            // Through API:
            // Remove spaces and symbols from column name
            // And in lowercase
            $requestPayload['column_name'] = SchemaUtils::cleanColumnName($requestPayload['column_name']);
            $params['column_name'] = $tableGateway->addColumn($tableName, $requestPayload);
            $response = [
                'meta' => ['type' => 'item', 'table' => 'directus_columns'],
                'data' => TableSchema::getColumnSchema($tableName, $params['column_name'])->toArray()
            ];
        } else {
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
            $hasColumn = TableSchema::hasTableColumn($table, $column);
            $success = false;

            if ($hasColumn) {
                $success = $tableGateway->dropColumn($column);
            }

            $response = [
                'meta' => [
                    'table' => $tableGateway->getTable(),
                    'column' => $column
                ],
                'success' => $success
            ];

            // Success: __t('column_x_was_removed', ['column' => $column]),
            // @TODO: implement successful messages
            if ($hasColumn && !$success) {
                $response['error']['message'] = __t('unable_to_remove_column_x', ['column' => $column]);
            } else if (!$hasColumn) {
                // @TODO: add translation
                $response['error']['message'] = sprintf('column `%s` does not exists in table: `%s`', $column, $table);
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

            $TableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
            $columnData = $TableGateway->select([
                'table_name' => $table,
                'column_name' => $column
            ])->current();

            if ($columnData) {
                $columnData = $columnData->toArray();

                if ($app->request()->isPut()) {
                    $requestPayload = ArrayUtils::pick($requestPayload, [
                        'data_type',
                        'ui',
                        'hidden_input',
                        'hidden_list',
                        'required',
                        'relationship_type',
                        'related_table',
                        'junction_table',
                        'junction_key_left',
                        'junction_key_right',
                        'sort',
                        'comment'
                    ]);
                }

                $requestPayload['id'] = $columnData['id'];
                $TableGateway->updateCollection($requestPayload);
            }
        }

        $response = TableSchema::getSchemaArray($table, $params);
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
        //$data['column_name'] = $data['junction_key_left'];
        $data['column_name'] = $column;
        $data['table_name'] = $table;
        $row = $TableGateway->findOneByArray(['table_name' => $table, 'column_name' => $column]);

        if ($row) {
            $data['id'] = $row['id'];
        }
        $newRecord = $TableGateway->manageRecordUpdate('directus_columns', $data, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
        $_POST['id'] = $newRecord['id'];
        return $this->app->response($_POST);
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
            $tableGateway = new TableGateway($table, $ZendDb, $acl);
            $success = $tableGateway->drop();

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

        $TableGateway = new DirectusTablesTableGateway($ZendDb, $acl, null, null, null, 'table_name');

        /* PUT updates the table */
        if ($app->request()->isPut() || $app->request()->isPatch()) {
            $data = $requestPayload;
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

        $response = $tableGateway->selectWith($select)->current();

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

            if ($row) {
                $TableGateway->update($row, [
                    'table_name' => $table,
                    'column_name' => $column
                ]);
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
