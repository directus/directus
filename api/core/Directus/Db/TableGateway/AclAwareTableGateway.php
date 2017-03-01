<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Acl\Exception\UnauthorizedTableBigDeleteException;
use Directus\Acl\Exception\UnauthorizedTableBigEditException;
use Directus\Acl\Exception\UnauthorizedTableDeleteException;
use Directus\Acl\Exception\UnauthorizedTableEditException;
use Directus\Auth\Provider as Auth;
use Directus\Db\Exception\DuplicateEntryException;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableSchema;
use Directus\Util\ArrayUtils;
use Directus\Util\Formatting;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\Exception\InvalidQueryException;
use Zend\Db\ResultSet\ResultSet;
use Zend\Db\ResultSet\ResultSetInterface;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Update;
use Zend\Db\TableGateway\Feature;

class AclAwareTableGateway extends BaseTableGateway
{
    /**
     * Directus ACL instance
     *
     * @var \Directus\Acl\Acl
     */
    protected $acl;

    /**
     * Constructor
     *
     * @param \Directus\Acl\Acl $acl
     * @param string $table
     * @param AdapterInterface $adapter
     * @param Feature\AbstractFeature|Feature\FeatureSet|Feature\AbstractFeature[] $features
     * @param ResultSetInterface $resultSetPrototype
     * @param Sql $sql
     * @param string $primaryKeyName
     *
     * @throws \InvalidArgumentException
     */
    public function __construct(Acl $acl, $table, AdapterInterface $adapter, $features = null, ResultSetInterface $resultSetPrototype = null, Sql $sql = null, $primaryKeyName = null)
    {
        $this->acl = $acl;
        $rowGatewayPrototype = new AclAwareRowGateway($acl, $this->primaryKeyFieldName, $table, $adapter, $sql);
        $rowGatewayFeature = new Feature\RowGatewayFeature($rowGatewayPrototype);
        $features = ($features) ? [$features] : [];
        array_push($features, $rowGatewayFeature);

        parent::__construct($table, $adapter, $features, $resultSetPrototype, $sql, $primaryKeyName);
    }

    /**
     * Static Factory Methods
     */

    /**
     * Underscore to camelcase table name to namespaced table gateway classname,
     * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
     */
    public static function makeTableGatewayFromTableName($acl, $table, $adapter)
    {
        // @TODO: similar method to the parent class
        $tableGatewayClassName = Formatting::underscoreToCamelCase($table) . 'TableGateway';
        $tableGatewayClassName = __NAMESPACE__ . '\\' . $tableGatewayClassName;
        if (class_exists($tableGatewayClassName)) {
            return new $tableGatewayClassName($acl, $adapter);
        }
        return new self($acl, $table, $adapter);
    }

    public function newRow($table = null, $pk_field_name = null)
    {
        $table = is_null($table) ? $this->table : $table;
        $pk_field_name = is_null($pk_field_name) ? $this->primaryKeyFieldName : $pk_field_name;
        $row = new AclAwareRowGateway($this->acl, $pk_field_name, $table, $this->adapter);
        return $row;
    }

    /**
     * Make a new table gateway
     *
     * @param $tableName
     *
     * @return BaseTableGateway
     */
    public function makeTable($tableName)
    {
        return new self($this->acl, $tableName, $this->adapter);
    }

    /**
     * @param null $tableName
     *
     * @return bool
     *
     * @throws UnauthorizedTableAddException
     */
    public function drop($tableName = null)
    {
        $this->canAlter($tableName);

        return parent::drop($tableName);
    }

    /**
     * @param $columnName
     * @param null $tableName
     *
     * @return bool
     *
     * @throws UnauthorizedTableAddException
     */
    public function dropColumn($columnName, $tableName = null)
    {
        $this->canAlter($tableName);

        return parent::dropColumn($columnName, $tableName);
    }

    public function canAlter($tableName = null)
    {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if (!$this->acl->hasTablePrivilege($tableName, 'alter')) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableAddException($aclErrorPrefix . 'Table alter access forbidden on table ' . $tableName);
        }
    }

    /**
     * @param Select $select
     *
     * @return ResultSet
     *
     * @throws \Directus\Acl\Exception\UnauthorizedFieldReadException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldWriteException
     * @throws \Exception
     */
    protected function executeSelect(Select $select)
    {
        /**
         * ACL Enforcement
         */
        $selectState = $select->getRawState();
        $table = $this->getRawTableNameFromQueryStateTable($selectState['table']);

        // Enforce field read blacklist on Select's main table
        try {
            // @TODO: Enforce must return a list of columns without the blacklist
            // when asterisk (*) is used
            // and only throw and error when all the selected columns are blacklisted
            $this->acl->enforceBlacklist($table, $selectState['columns'], Acl::FIELD_READ_BLACKLIST);
        } catch (\Exception $e) {
            if ($selectState['columns'][0] != '*') {
                throw $e;
            }

            $selectState['columns'] = TableSchema::getAllNonAliasTableColumns($table);
            $this->acl->enforceBlacklist($table, $selectState['columns'], Acl::FIELD_READ_BLACKLIST);
        }

        // Enforce field read blacklist on Select's join tables
        foreach ($selectState['joins'] as $join) {
            $joinTable = $this->getRawTableNameFromQueryStateTable($join['name']);
            $this->acl->enforceBlacklist($joinTable, $join['columns'], Acl::FIELD_READ_BLACKLIST);
        }

        try {
            return parent::executeSelect($select, ArrayUtils::get(func_get_args(), 1, []));
        } catch (InvalidQueryException $e) {
            if ('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException('This query failed: ' . $this->dumpSql($select), 0, $e);
            }
            // @todo send developer warning
            throw $e;
        }
    }

    /**
     * @param Insert $insert
     * @return mixed
     * @throws DuplicateEntryException
     * @throws UnauthorizedTableAddException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldReadException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldWriteException
     */
    protected function executeInsert(Insert $insert)
    {
        /**
         * ACL Enforcement
         */

        $insertState = $insert->getRawState();
        $insertTable = $this->getRawTableNameFromQueryStateTable($insertState['table']);
        $insertData = $insertState['values'];

        if (!$this->acl->hasTablePrivilege($insertTable, 'add')) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableAddException($aclErrorPrefix . 'Table add access forbidden on table ' . $insertTable);
        }

        // Enforce write field blacklist
        $this->acl->enforceBlacklist($insertTable, $insertState['columns'], Acl::FIELD_WRITE_BLACKLIST);

        try {
            // Data to be inserted with the column name as assoc key.
            $insertDataAssoc = array_combine($insertState['columns'], $insertData);

            $this->runHook('table.insert:before', [$insertTable, $insertDataAssoc]);
            $this->runHook('table.insert.' . $insertTable . ':before', [$insertDataAssoc]);

            $result = parent::executeInsert($insert);
            $insertTableGateway = new self($this->acl, $insertTable, $this->adapter);

            // hotfix: directus_tables does not have auto generated value primary key
            if ($this->getTable() === 'directus_tables') {
                $generatedValue = ArrayUtils::get($insertDataAssoc, $this->primaryKeyFieldName, 'table_name');
            } else {
                $generatedValue = $this->getLastInsertValue();
            }

            $resultData = $insertTableGateway->find($generatedValue);

            $this->runHook('table.insert', [$insertTable, $resultData]);
            $this->runHook('table.insert.' . $insertTable, [$resultData]);
            $this->runHook('table.insert:after', [$insertTable, $resultData]);
            $this->runHook('table.insert.' . $insertTable . ':after', [$resultData]);

            return $result;
        } catch (InvalidQueryException $e) {
            // @todo send developer warning
            // @TODO: This is not being call in BaseTableGateway
            if (strpos(strtolower($e->getMessage()), 'duplicate entry') !== FALSE) {
                throw new DuplicateEntryException($e->getMessage());
            }

            if ('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException('This query failed: ' . $this->dumpSql($insert), 0, $e);
            }

            throw $e;
        }
    }

    /**
     * @param Update $update
     *
     * @return mixed
     *
     * @throws DuplicateEntryException
     * @throws UnauthorizedTableBigEditException
     * @throws UnauthorizedTableEditException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldReadException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldWriteException
     */
    protected function executeUpdate(Update $update)
    {
        $currentUserId = null;
        if (Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }

        $updateState = $update->getRawState();
        $updateTable = $this->getRawTableNameFromQueryStateTable($updateState['table']);
        $cmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable($updateTable);
        $updateData = $updateState['set'];

        /**
         * ACL Enforcement
         */
        // check if it's NOT soft delete
        $updateFields = $updateState['set'];

        $permissionName = 'edit';
        $hasStatusColumn = array_key_exists(STATUS_COLUMN_NAME, $updateFields) ? true : false;
        if ($hasStatusColumn && $updateFields[STATUS_COLUMN_NAME] == STATUS_DELETED_NUM) {
            $permissionName = 'delete';
        }

        if (!$this->acl->hasTablePrivilege($updateTable, 'big' . $permissionName)) {
            // Parsing for the column name is unnecessary. Zend enforces raw column names.
            /**
             * Enforce Privilege: "Big" Edit
             */
            if (false === $cmsOwnerColumn) {
                // All edits are "big" edits if there is no magic owner column.
                $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                throw new UnauthorizedTableBigEditException($aclErrorPrefix . 'The table `' . $updateTable . '` is missing the `user_create_column` within `directus_tables` (BigEdit Permission Forbidden)');
            } else {
                // Who are the owners of these rows?
                list($resultQty, $ownerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                // Enforce
                if (is_null($currentUserId) || count(array_diff($ownerIds, [$currentUserId]))) {
                    // $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    // throw new UnauthorizedTableBigEditException($aclErrorPrefix . "Table bigedit access forbidden on $resultQty `$updateTable` table record(s) and " . count($ownerIds) . " CMS owner(s) (with ids " . implode(", ", $ownerIds) . ").");
                    $groupsTableGateway = self::makeTableGatewayFromTableName($this->acl, 'directus_groups', $this->adapter);
                    $group = $groupsTableGateway->find($this->acl->getGroupId());
                    throw new UnauthorizedTableBigEditException('[' . $group['name'] . '] permissions only allow you to [' . $permissionName . '] your own items.');
                }
            }
        }

        if (!$this->acl->hasTablePrivilege($updateTable, $permissionName)) {
            /**
             * Enforce Privilege: "Little" Edit (I am the record CMS owner)
             */
            if (false !== $cmsOwnerColumn) {
                if (!isset($predicateResultQty)) {
                    // Who are the owners of these rows?
                    list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                }

                if (in_array($currentUserId, $predicateOwnerIds)) {
                    $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableEditException($aclErrorPrefix . 'Table edit access forbidden on ' . $predicateResultQty . '`' . $updateTable . '` table records owned by the authenticated CMS user (#' . $currentUserId . '.');
                }
            }
        }

        // Enforce write field blacklist
        $attemptOffsets = array_keys($updateState['set']);
        $this->acl->enforceBlacklist($updateTable, $attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);

        try {
            $this->runHook('table.update:before', [$updateTable, $updateData]);
            $this->runHook('table.update.' . $updateTable . ':before', [$updateData]);
            $result = parent::executeUpdate($update);
            $this->runHook('table.update', [$updateTable, $updateData]);
            $this->runHook('table.update:after', [$updateTable, $updateData]);
            $this->runHook('table.update.' . $updateTable, [$updateData]);
            $this->runHook('table.update.' . $updateTable . ':after', [$updateData]);

            return $result;
        } catch (InvalidQueryException $e) {
            // @TODO: these lines are the same as the executeInsert,
            // let's put it together
            if (strpos(strtolower($e->getMessage()), 'duplicate entry') !== FALSE) {
                throw new DuplicateEntryException($e->getMessage());
            }

            if ('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException('This query failed: ' . $this->dumpSql($update), 0, $e);
            }

            // @todo send developer warning
            throw $e;
        }
    }

    /**
     * @param Delete $delete
     *
     * @return mixed
     *
     * @throws \RuntimeException
     * @throws \Directus\Acl\Exception\UnauthorizedTableBigDeleteException
     * @throws \Directus\Acl\Exception\UnauthorizedTableDeleteException
     */
    protected function executeDelete(Delete $delete)
    {
        $cuurrentUserId = null;
        if (Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }
        $deleteState = $delete->getRawState();
        $deleteTable = $this->getRawTableNameFromQueryStateTable($deleteState['table']);
        $cmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable($deleteTable);
        $canBigDelete = $this->acl->hasTablePrivilege($deleteTable, 'bigdelete');
        $canDelete = $this->acl->hasTablePrivilege($deleteTable, 'delete');
        $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

        if (!TableSchema::hasTableColumn($deleteTable, STATUS_COLUMN_NAME)) {
            if ($this->acl->hasTablePrivilege($deleteTable, 'bigdelete')) {
                $canBigDelete = true;
            } else if ($this->acl->hasTablePrivilege($deleteTable, 'delete')) {
                $canDelete = true;
            }
        }

        // @todo: clean way
        if ($deleteTable === 'directus_bookmarks') {
            $canBigDelete = true;
        }

        /**
         * ACL Enforcement
         */

        if (!$canBigDelete && !$canDelete) {
            throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . ' forbidden to hard delete on table `' . $deleteTable . '` because it has Status Column.');
        }

        if (false === $cmsOwnerColumn) {
            // cannot delete if there's no magic owner column and can't big delete
            if (!$canBigDelete) {
                // All deletes are "big" deletes if there is no magic owner column.
                throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . 'The table `' . $deleteTable . '` is missing the `user_create_column` within `directus_tables` (BigHardDelete Permission Forbidden)');
            }
        } else {
            if (!$canBigDelete) {
                // Who are the owners of these rows?
                list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $deleteState['where']);
                if (!in_array($currentUserId, $predicateOwnerIds)) {
                    //   $exceptionMessage = "Table harddelete access forbidden on $predicateResultQty `$deleteTable` table records owned by the authenticated CMS user (#$currentUserId).";
                    $groupsTableGateway = self::makeTableGatewayFromTableName($this->acl, 'directus_groups', $this->adapter);
                    $group = $groupsTableGateway->find($this->acl->getGroupId());
                    $exceptionMessage = '[' . $group['name'] . '] permissions only allow you to [delete] your own items.';
                    //   $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableDeleteException($exceptionMessage);
                }
            }
        }

        try {
            $this->runHook('table.delete:before', [$deleteTable]);
            $this->runHook('table.delete.' . $deleteTable . ':before');
            $result = parent::executeDelete($delete);
            $this->runHook('table.delete', [$deleteTable]);
            $this->runHook('table.delete:after', [$deleteTable]);
            $this->runHook('table.delete.' . $deleteTable);
            $this->runHook('table.delete.' . $deleteTable . ':after');
            return $result;
        } catch (InvalidQueryException $e) {
            if ('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException('This query failed: ' . $this->dumpSql($delete), 0, $e);
            }
            // @todo send developer warning
            throw $e;
        }
    }
}
