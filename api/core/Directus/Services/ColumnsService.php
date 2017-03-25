<?php

namespace Directus\Services;

use Directus\Database\Ddl\Column\Custom;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Ddl\AlterTable;
use Zend\Db\Sql\Sql;

class ColumnsService extends AbstractService
{
    /**
     * @var TableGateway
     */
    protected $tableGateway = null;

    /**
     * Gets the given column data
     *
     * It creates the directus data if it does not exists
     * based on the actual column information
     *
     * @param $tableName
     * @param $columnName
     *
     * @return \Directus\Database\RowGateway\BaseRowGateway
     */
    private function getColumnData($tableName, $columnName)
    {
        $tableGateway = $this->getTableGateway();
        $columnData = $tableGateway->select([
            'table_name' => $tableName,
            'column_name' => $columnName
        ])->current();

        if (!$columnData) {
            $columnObject = $this->getColumnObject($tableName, $columnName);
            $data = ArrayUtils::pick($columnObject->toArray(), [
                'table_name',
                'column_name',
                'data_type',
                'ui',
                'sort',
                'comment'
            ]);
            $columnData = $tableGateway->manageRecordUpdate('directus_columns', $data, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
        }

        return $columnData;
    }

    /**
     * Updates the given column
     *
     * @param $tableName
     * @param $columnName
     * @param $data
     * @param bool $patch
     *
     * @return null
     */
    public function update($tableName, $columnName, $data, $patch = false)
    {
        $tableGateway = $this->getTableGateway();

        $columnData = $this->getColumnData($tableName, $columnName);
        if (!$columnData) {
            return null;
        }

        $columnData = $columnData->toArray();

        $this->ddlUpdate($tableName, $columnName, $data);
        $data = ArrayUtils::pick($data, [
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

        if ($data) {
            $data['id'] = $columnData['id'];
            $tableGateway->updateCollection($data);
        }

        return $data;
    }

    /**
     * Gets the column representation object
     *
     * @param $tableName
     * @param $columnName
     *
     * @return \Directus\Database\Object\Column
     */
    public function getColumnObject($tableName, $columnName)
    {
        return TableSchema::getColumnSchema($tableName, $columnName);
    }

    /**
     * Get the table gateway
     *
     * @return TableGateway
     */
    public function getTableGateway()
    {
        if (!$this->tableGateway) {
            $container = $this->app->container;
            $dbConnection = $container->get('zenddb');
            $acl = $container->get('acl');

            $this->tableGateway = new TableGateway('directus_columns', $dbConnection, $acl);
        }

        return $this->tableGateway;
    }

    public function ddlUpdate($tableName, $columnName, $data)
    {
        if (ArrayUtils::has($data, 'default_value') || ArrayUtils::has($data, 'data_type')) {
            $adapter = $this->getTableGateway()->getAdapter();
            $columnObject = $this->getColumnObject($tableName, $columnName);

            $alterTable = new AlterTable($tableName);
            $newColumn = new Custom(
                $columnName,
                $columnObject->getLength(),
                $columnObject->isNullable(),
                $columnObject->getDefaultValue()
            );

            if (ArrayUtils::has($data, 'default_value')) {
                $newColumn->setDefault($data['default_value']);
            }

            // @TODO: add a list of supported types by databases
            $type = ArrayUtils::get($data, 'data_type', $columnObject->getDataType());
            $newColumn->setType($type);

            if (ArrayUtils::has($data, 'length')) {
                $length = ArrayUtils::get($data, 'length', 0);
                $newColumn->setLength($length);
            }

            $alterTable->changeColumn($columnName, $newColumn);

            $sql = new Sql($adapter);
            $query = $sql->getSqlStringForSqlObject($alterTable);
            $adapter->query($query)->execute();
        }
    }
}
