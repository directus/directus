<?php

namespace Directus\Db\RowGateway;

use Directus\Bootstrap;
use Directus\Db\TableGateway\RelationalTableGateway;
use Directus\Db\TableSchema;
use Directus\Util\Formatting;
use Zend\Db\RowGateway\RowGateway;

class BaseRowGateway extends RowGateway
{
    /**
     * Override this function to do table-specific record data filtration, pre-insert and update.
     * This method is called during #populate and #populateSkipAcl.
     * @param  array $rowData
     * @param  boolean $rowExistsInDatabase
     * @return array  Filtered $rowData.
     */
    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // Custom gateway logic
        return $rowData;
    }

    /**
     * HELPER FUNCTIONS
     */

    /**
     * @param $table
     * @param $adapter
     * @param string $primaryKeyColumn
     *
     * @return BaseRowGateway
     */
    public static function makeRowGatewayFromTableNameSkipAcl($table, $adapter, $primaryKeyColumn = 'id')
    {
        // Underscore to camelcase table name to namespaced row gateway classname,
        // e.g. directus_users => \Directus\Db\RowGateway\DirectusUsersRowGateway
        $rowGatewayClassName = Formatting::underscoreToCamelCase($table) . 'RowGateway';
        $rowGatewayClassName = __NAMESPACE__ . '\\' . $rowGatewayClassName;
        if (class_exists($rowGatewayClassName))
            return new $rowGatewayClassName($primaryKeyColumn, $table, $adapter);
        return new self($primaryKeyColumn, $table, $adapter);
    }

    public static function stringifyPrimaryKeyForRecordDebugRepresentation(array $primaryKeyData)
    {
        if (null === $primaryKeyData) {
            return 'null primary key';
        }

        return 'primary key (' . implode(':', array_keys($primaryKeyData)) . ') "' . implode(':', $primaryKeyData) . '"';
    }

    public function logger()
    {
        return Bootstrap::get('app')->getLog();
    }

    public function toArrayWithImmediateRelationships(RelationalTableGateway $TableGateway)
    {
        if ($this->table !== $TableGateway->getTable()) {
            throw new \InvalidArgumentException('The table of the gateway parameter must match this row\'s table.');
        }

        $entry = $this->toArray();
        $schemaArray = TableSchema::getSchemaArray($this->table);
        $aliasColumns = $TableGateway->filterSchemaAliasFields($schemaArray);
        // Many-to-One
        list($entry) = $TableGateway->loadManyToOneRelationships($schemaArray, [$entry]);
        // One-to-Many, Many-to-Many
        $entry = $TableGateway->loadToManyRelationships($entry, $aliasColumns);

        return $entry;
    }

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool $rowExistsInDatabase
     * @return AclAwareRowGateway
     */
    public function populate(array $rowData, $rowExistsInDatabase = false)
    {
        // IDEAL OR SOMETHING LIKE IT
        // grab record
        // populate skip acl
        // diff btwn real record $rowData parameter
        // only run blacklist on the diff from real data and the db data

        $rowData = $this->preSaveDataHook($rowData, $rowExistsInDatabase);

        //if(!$this->acl->hasTablePrivilege($this->table, 'bigedit')) {
        // Enforce field write blacklist
        // $attemptOffsets = array_keys($rowData);
        // $this->acl->enforceBlacklist($this->table, $attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);
        //}

        return parent::populate($rowData, $rowExistsInDatabase);
    }
}
