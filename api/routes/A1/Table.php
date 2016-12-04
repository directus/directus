<?php

namespace Directus\API\Routes\A1;

use Directus\Acl\Exception\UnauthorizedTableAlterException;
use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusUiTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Directus\Util\SchemaUtils;
use Directus\View\JsonView;

class Table extends Route
{
    public function columns($table_name)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();
        $params = $app->request()->get();

        $params['table_name'] = $table_name;
        if ($app->request()->isPost()) {
            /**
             * @todo  check if a column by this name already exists
             * @todo  build this into the method when we shift its location to the new layer
             */
            if (!$acl->hasTablePrivilege($table_name, 'alter')) {
                throw new UnauthorizedTableAlterException(__t('permission_table_alter_access_forbidden_on_table', [
                    'table_name' => $table_name
                ]));
            }

            $tableGateway = new TableGateway($table_name, $ZendDb, $acl);
            // Through API:
            // Remove spaces and symbols from column name
            // And in lowercase
            $requestPayload['column_name'] = SchemaUtils::cleanColumnName($requestPayload['column_name']);
            $params['column_name'] = $tableGateway->addColumn($table_name, $requestPayload);
        }

        $response = TableSchema::getColumnSchema($table_name, $params['column_name']);

        JsonView::render($response->toArray());
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
            $success = $tableGateway->dropColumn($column);

            $response = [
                'message' => __t('unable_to_remove_column_x', ['column_name' => $column]),
                'success' => false
            ];

            if ($success) {
                $response['success'] = true;
                $response['error']['message'] = __t('column_x_was_removed');
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
        if ($app->request()->isPut()) {
            $data = $requestPayload;
            $table_settings = [
                'table_name' => $data['table_name'],
                'hidden' => (int)$data['hidden'],
                'single' => (int)$data['single'],
                'footer' => (int)$data['footer'],
                'primary_column' => array_key_exists('primary_column', $data) ? $data['primary_column'] : ''
            ];

            //@TODO: Possibly pretty this up so not doing direct inserts/updates
            $set = $TableGateway->select(['table_name' => $table])->toArray();

            //If item exists, update, else insert
            if (count($set) > 0) {
                $TableGateway->update($table_settings, ['table_name' => $table]);
            } else {
                $TableGateway->insert($table_settings);
            }

            $column_settings = [];
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