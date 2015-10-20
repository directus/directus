<?php

namespace Directus\Db\RowGateway;

use Directus\Bootstrap;
use Directus\Auth\Provider as Auth;
use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Acl\Exception\UnauthorizedTableBigEditException;
use Directus\Acl\Exception\UnauthorizedTableEditException;
use Directus\Acl\Exception\UnauthorizedFieldReadException;
use Directus\Acl\Exception\UnauthorizedFieldWriteException;
use Directus\Db\TableGateway\RelationalTableGateway;
use Directus\Db\TableSchema;
use Directus\Util\Formatting;
use Zend\Db\Adapter\Exception\InvalidQueryException;
use Zend\Db\RowGateway\RowGateway;

class AclAwareRowGateway extends RowGateway {

    protected $acl;

    /**
     * Constructor
     * @param acl $acl
     * @param string $primaryKeyColumn
     * @param string|\Zend\Db\Sql\TableIdentifier $table
     * @param Adapter|Sql $adapterOrSql
     * @throws Exception\InvalidArgumentException
     */
    public function __construct(Acl $acl, $primaryKeyColumn, $table, $adapterOrSql) {
        $this->acl = $acl;
        parent::__construct($primaryKeyColumn, $table, $adapterOrSql);
    }

    /**
     * Override this function to do table-specific record data filtration, pre-insert and update.
     * This method is called during #populate and #populateSkipAcl.
     * @param  array   $rowData
     * @param  boolean $rowExistsInDatabase
     * @return array  Filtered $rowData.
     */
    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false) {
        // Custom gateway logic
        return $rowData;
    }

    /**
     * HELPER FUNCTIONS
     */

    public static function makeRowGatewayFromTableName($acl, $table, $adapter, $pkFieldName = 'id') {
        // Underscore to camelcase table name to namespaced row gateway classname,
        // e.g. directus_users => \Directus\Db\RowGateway\DirectusUsersRowGateway
        $rowGatewayClassName = Formatting::underscoreToCamelCase($table) . "RowGateway";
        $rowGatewayClassName = __NAMESPACE__ . "\\$rowGatewayClassName";
        if(class_exists($rowGatewayClassName))
            return new $rowGatewayClassName($acl, $pkFieldName, $table, $adapter);
        return new self($acl, $pkFieldName, $table, $adapter);
    }

    public static function stringifyPrimaryKeyForRecordDebugRepresentation(array $primaryKeyData) {
        if(null === $primaryKeyData) {
            return "null primary key";
        }
        return "primary key (" . implode(":", array_keys($primaryKeyData)) . ") \"" . implode(":", $primaryKeyData) . "\"";
    }

    // // as opposed to toArray()
    // // used only for proof of concept
    // public function __getUncensoredDataForTesting() {
    //     return $this->data;
    // }

    public function logger() {
        return Bootstrap::get('app')->getLog();
    }

    /**
     * ONLY USE THIS FOR INITIALIZING THE ROW OBJECT.
     *
     * This function does not enforce ACL write privileges.
     * It shouldn't be used to fulfill data assignment on behalf of the user.
     *
     * @param  mixed  $rowData Row key/value pairs.
     * @return AclAwareRowGateway
     */
    public function populateSkipAcl(array $rowData, $rowExistsInDatabase = false) {
        // $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__);
        // $log->info("args: " . print_r(func_get_args(), true));
        $this->initialize();
        $rowData = $this->preSaveDataHook($rowData, $rowExistsInDatabase);
        $this->data = $rowData;
        if ($rowExistsInDatabase == true) {
            $this->processPrimaryKeyData();
        } else {
            $this->primaryKeyData = null;
        }
        return $this;
    }

    public function toArrayWithImmediateRelationships(RelationalTableGateway $TableGateway) {
        if($this->table !== $TableGateway->getTable()) {
            throw new \InvalidArgumentException("The table of the gateway parameter must match this row's table.");
        }
        $entry = $this->toArray();
        $schemaArray = TableSchema::getSchemaArray($this->table);
        $aliasColumns = $TableGateway->filterSchemaAliasFields($schemaArray);
        // Many-to-One
        list($entry) = $TableGateway->loadManyToOneRelationships($schemaArray, array($entry));
        // One-to-Many, Many-to-Many
        $entry = $TableGateway->loadToManyRelationships($entry, $aliasColumns);
        return $entry;
    }

    /**
     * OVERRIDES
     */

    /**
     * ONLY USE THIS FOR INITIALIZING THE ROW OBJECT.
     *
     * This function does not enforce ACL write privileges.
     * It shouldn't be used to fulfill data assignment on behalf of the user.
     * @param  mixed $rowData Row key/value pairs.
     * @return AclAwareRowGateway
     */
    public function exchangeArray($rowData) {
        return $this->populateSkipAcl($rowData, true);
    }

    public function delete() {
        /**
         * ACL Enforcement
         */
        $currentUserId = null;
        if(Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }
        $cmsOwnerId = $this->acl->getRecordCmsOwnerId($this, $this->table);
        if (!TableSchema::hasTableColumn($this->table, STATUS_COLUMN_NAME)) {
            throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . " forbidden to hard delete on table `{$this->table}` because it has status column.");
        }

        /**
         * Enforce Privilege: "Little" Delete (I am the record CMS owner)
         */
        if($cmsOwnerId === $currentUserId) {
            if(!$this->acl->hasTablePrivilege($this->table, 'delete')) {
                $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
                $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                throw new UnauthorizedTableDeleteException($aclErrorPrefix . "Table harddelete access forbidden on `" . $this->table . "` table record with $recordPk owned by the authenticated CMS user (#$cmsOwnerId).");
            }
        }
        /**
         * Enforce Privilege: "Big" Delete (I am not the record CMS owner)
         */
        else {
            if(!$this->acl->hasTablePrivilege($this->table, 'bigdelete')) {
                $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
                $recordOwner = (false === $cmsOwnerId) ? "no magic owner column" : "the CMS owner #$cmsOwnerId";
                $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . "Table bigharddelete access forbidden on `" . $this->table . "` table record with $recordPk and $recordOwner.");
            }
        }
        return parent::delete();
    }

    public function save() {
        $this->initialize();

        $currentUserId = null;
        if(Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }

        /**
         * ACL Enforcement
         * Note: Field Write Blacklists are enforced at the object setter level
         * (AARG#__set, AARG#populate, AARG#offsetSet)
         */
        if(!$this->rowExistsInDatabase()) {
            /**
             * Enforce Privilege: Table Add
             */
            if(!$this->acl->hasTablePrivilege($this->table, 'add')) {
                $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                throw new UnauthorizedTableAddException($aclErrorPrefix . "Table add access forbidden on table " . $this->table);
            }
        } else {
            $cmsOwnerId = $this->acl->getRecordCmsOwnerId($this, $this->table);
            /**
             * Enforce Privilege: "Little" Edit (I am the record CMS owner)
             */
            if($cmsOwnerId === intval($currentUserId)) {
                if(!$this->acl->hasTablePrivilege($this->table, 'edit')) {
                    $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
                    $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableEditException($aclErrorPrefix . "Table edit access forbidden on `" . $this->table . "` table record with $recordPk owned by the authenticated CMS user (#$cmsOwnerId).");
                }
            }
            /**
             * Enforce Privilege: "Big" Edit (I am not the record CMS owner)
             */
            else {
                if(!$this->acl->hasTablePrivilege($this->table, 'bigedit')) {
                    $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
                    $recordOwner = (false === $cmsOwnerId) ? "no magic owner column" : "the CMS owner #$cmsOwnerId";
                    $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableBigEditException($aclErrorPrefix . "Table bigedit access forbidden on `" . $this->table . "` table record with $recordPk and $recordOwner.");
                }
            }
        }

        try {
            return parent::save();
        } catch(InvalidQueryException $e) {
            $this->logger()->fatal("Error running save on this data: " . print_r($this->data, true));
            throw $e;
        }
    }

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool  $rowExistsInDatabase
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

    /**
     * Offset Exists
     *
     * @param  string $offset
     * @return bool
     */
    public function offsetExists($offset)
    {
        // Filter censored fields
        $censoredData = $this->toArray();
        return array_key_exists($offset, $censoredData);
    }

    /**
     * @return int
     */
    public function count()
    {
        // Don't include censored fields in the field count
        $censoredData = $this->toArray();
        return count($censoredData);
    }

    /**
     * __get
     *
     * @param  string $name
     * @return mixed
     */
    public function __get($name)
    {
        // Confirm user group has read privileges on field with name $name
        $this->acl->enforceBlacklist($this->table, $name, ACL::FIELD_READ_BLACKLIST);
        return parent::__get($name);
    }

    /**
     * Offset get
     *
     * @param  string $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        // Confirm user group has read privileges on field with name $offset
        $this->acl->enforceBlacklist($this->table, $offset, ACL::FIELD_READ_BLACKLIST);
        return parent::offsetGet($offset);
    }

    /**
     * Offset set
     *
     * NOTE: Protecting this method protects self#__set, which calls this method in turn.
     *
     * @param  string $offset
     * @param  mixed $value
     * @return AclAwareRowGateway
     */
    public function offsetSet($offset, $value)
    {
        //if(!$this->acl->hasTablePrivilege($this->table, 'bigedit')) {
            // Enforce field write blacklist
            $this->acl->enforceBlacklist($this->table, $offset, Acl::FIELD_WRITE_BLACKLIST);
        //}
        return parent::offsetSet($offset, $value);
    }

    /**
     * Offset unset
     *
     * @param  string $offset
     * @return AclAwareRowGateway
     */
    public function offsetUnset($offset)
    {
        //if(!$this->acl->hasTablePrivilege($this->table, 'bigedit')) {
            // Enforce field write blacklist
            $this->acl->enforceBlacklist($this->table, $offset, Acl::FIELD_WRITE_BLACKLIST);
        //}
        return parent::offsetUnset($offset);
    }

    /**
     * To array
     *
     * @return array
     */
    public function toArray()
    {
        // Enforce field read blacklist
        $data = $this->acl->censorFields($this->table, $this->data);
        return $data;
    }

}