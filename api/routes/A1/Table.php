<?php

namespace Directus\API\Routes\A1;

use Directus\Database\Object\Column;
use Directus\Permissions\Exception\UnauthorizedTableAlterException;
use Directus\Application\Route;
use Directus\Bootstrap;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\DirectusUiTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Directus\Util\SchemaUtils;
use Directus\View\JsonView;

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
            return JsonView::render(['message' => __t('invalid_table_name')]);
        }

        $schema = Bootstrap::get('schemaManager');
        if ($schema->tableExists($requestPayload['name'])) {
            return JsonView::render([
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

        // $params['table_name'] = $table_name;
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
        }

        // $response = TableSchema::getColumnSchema($table_name, $params['column_name']);
        $response = TableSchema::getTableColumnsSchema($tableName, $params);

        JsonView::render([
            'meta' => [
                'table' => 'directus_table'
            ],
            'data' => array_map(function(Column $column) {
                return $column->toArray();
            }, $response)
        ]);
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

            return JsonView::render($response);
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

        if ($app->request()->isPut()) {
            $TableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
            $columnData = $TableGateway->select([
                'table_name' => $table,
                'column_name' => $column
            ])->current();

            if ($columnData) {
                $columnData = $columnData->toArray();
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
            $response['data'] = $response;
            $response['meta'] = [
                'type' => 'collection',
                'table' => 'directus_columns'
            ];
        }

        JsonView::render($response);
    }

    public function postColumn($table, $column)
    {
        $container = $this->app->container;
        $ZendDb = $container->get('ZendDb');
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
        JsonView::render($_POST);
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

        JsonView::render($response);
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

            return JsonView::render($response);
        }

        $TableGateway = new TableGateway('directus_tables', $ZendDb, $acl, null, null, null, 'table_name');
        $ColumnsTableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
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
                $table_settings = array_filter($data);
            }

            //@TODO: Possibly pretty this up so not doing direct inserts/updates
            $set = $TableGateway->select(['table_name' => $table])->toArray();

            //If item exists, update, else insert
            if (count($set) > 0) {
                $TableGateway->update($table_settings, ['table_name' => $table]);
            } else {
                $TableGateway->insert($table_settings);
            }

            $column_settings = [];
            if (isset($data['columns']) && is_array($data['columns'])) {
                foreach ($data['columns'] as $col) {
                    $columnData = [
                        'table_name' => $table,
                        'column_name' => $col['column_name'],
                        'ui' => $col['ui'],
                        'hidden_input' => $col['hidden_input'] ? 1 : 0,
                        'hidden_list' => $col['hidden_list'] ? 1 : 0,
                        'required' => $col['required'] ? 1 : 0,
                        'sort' => array_key_exists('sort', $col) ? $col['sort'] : 99999,
                        'comment' => array_key_exists('comment', $col) ? $col['comment'] : ''
                    ];

                    // hotfix #1069 single_file UI not saving relational settings
                    $extraFields = ['data_type', 'relationship_type', 'related_table', 'junction_key_right'];
                    foreach ($extraFields as $field) {
                        if (array_key_exists($field, $col)) {
                            $columnData[$field] = $col[$field];
                        }
                    }

                    $existing = $ColumnsTableGateway->select(['table_name' => $table, 'column_name' => $col['column_name']])->toArray();
                    if (count($existing) > 0) {
                        $columnData['id'] = $existing[0]['id'];
                    }

                    array_push($column_settings, $columnData);
                }
            }

            $ColumnsTableGateway->updateCollection($column_settings);
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
        JsonView::render($response);
    }

    public function columnUi($table, $column, $ui)
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $requestPayload = $app->request()->post();
        $TableGateway = new TableGateway('directus_ui', $ZendDb, $acl);

        switch ($app->request()->getMethod()) {
            case 'PUT':
            case 'POST':
                $keys = ['table_name' => $table, 'column_name' => $column, 'ui_name' => $ui];
                $uis = to_name_value($requestPayload, $keys);

                $column_settings = [];
                foreach ($uis as $col) {
                    $existing = $TableGateway->select(['table_name' => $table, 'column_name' => $column, 'ui_name' => $ui, 'name' => $col['name']])->toArray();
                    if (count($existing) > 0) {
                        $col['id'] = $existing[0]['id'];
                    }
                    array_push($column_settings, $col);
                }
                $TableGateway->updateCollection($column_settings);
        }
        $UiOptions = new DirectusUiTableGateway($ZendDb, $acl);
        $response = $UiOptions->fetchOptions($table, $column, $ui);
        if (!$response) {
            $app->response()->setStatus(404);
            $response = [
                'message' => __t('unable_to_find_column_x_options_for_x', ['column' => $column, 'ui' => $ui]),
                'success' => false
            ];
        }

        JsonView::render($response);
    }
}
