<?php

namespace Directus\Database\RowGateway;

use Directus\Database\Schema\SchemaManager;
use Directus\Database\SchemaService;
use Directus\Permissions\Acl;
use Directus\Permissions\Exception\ForbiddenCollectionDeleteException;
use Directus\Permissions\Exception\ForbiddenCollectionUpdateException;
use Directus\Util\ArrayUtils;
use Directus\Util\Formatting;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\Exception\InvalidQueryException;
use Zend\Db\RowGateway\RowGateway;
use Zend\Db\RowGateway\RowGatewayInterface;
use Zend\Db\Sql\Sql;

class BaseRowGateway extends RowGateway
{
    /**
     * ACL instance
     *
     * @var Acl
     */
    protected $acl;

    /**
     * Schema Manager Instance
     *
     * @var SchemaManager
     */
    protected $schema;

    /**
     * Constructor
     *
     * @param string $primaryKeyColumn
     * @param string|\Zend\Db\Sql\TableIdentifier $table
     * @param AdapterInterface|Sql $adapterOrSql
     * @param Acl|null $acl
     * @param SchemaManager|null $schema
     *
     * @throws \InvalidArgumentException
     */
    public function __construct($primaryKeyColumn, $table, $adapterOrSql, Acl $acl = null, $schema = null)
    {
        if ($acl !== null && !($acl instanceof Acl)) {
            throw new \InvalidArgumentException('acl needs to be instance of \Directus\Permissions\Acl');
        }

        $this->acl = $acl;

        parent::__construct($primaryKeyColumn, $table, $adapterOrSql);
    }

    public function getId()
    {
        return $this->data[$this->primaryKeyColumn[0]];
    }

    public function getCollection()
    {
        return $this->table;
    }

    /**
     * Override this function to do table-specific record data filtration, pre-insert and update.
     * This method is called during #populate and #populateSkipAcl.
     *
     * @param  array $rowData
     * @param  boolean $rowExistsInDatabase
     *
     * @return array  Filtered $rowData.
     */
    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // Custom gateway logic
        return $rowData;
    }

    /**
     *
     * @param string|array $primaryKeyColumn
     * @param $table
     * @param $adapter
     * @param Acl|null $acl
     *
     * @return BaseRowGateway
     */
     public static function makeRowGatewayFromTableName($primaryKeyColumn, $table, $adapter, $acl = null)
     {

         // =============================================================================
         // @NOTE: Setting the column to 'id' by default
         //        As it mostly will be the default column
         //        Otherwise it will be set to whatever name or compose id is.
         // =============================================================================

         // Underscore to camelcase table name to namespaced row gateway classname,
         // e.g. directus_users => \Directus\Database\RowGateway\DirectusUsersRowGateway
         $rowGatewayClassName = Formatting::underscoreToCamelCase($table) . 'RowGateway';
         $rowGatewayClassName = __NAMESPACE__ . '\\' . $rowGatewayClassName;
         if (!class_exists($rowGatewayClassName)) {
             $rowGatewayClassName = get_called_class();
         }

         return new $rowGatewayClassName($primaryKeyColumn, $table, $adapter, $acl);
    }

    /**
     * @param array $primaryKeyData
     *
     * @return string
     */
    public static function stringifyPrimaryKeyForRecordDebugRepresentation($primaryKeyData)
    {
        if (null === $primaryKeyData) {
            return 'null primary key';
        }

        return 'primary key (' . implode(':', array_keys($primaryKeyData)) . ') "' . implode(':', $primaryKeyData) . '"';
    }

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool $rowExistsInDatabase
     *
     * @return RowGatewayInterface
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
     * ONLY USE THIS FOR INITIALIZING THE ROW OBJECT.
     *
     * This function does not enforce ACL write privileges.
     * It shouldn't be used to fulfill data assignment on behalf of the user.
     *
     * @param  mixed $rowData Row key/value pairs.
     * @param bool $rowExistsInDatabase
     *
     * @return RowGatewayInterface
     */
    public function populateSkipAcl(array $rowData, $rowExistsInDatabase = false)
    {
        return parent::populate($rowData, $rowExistsInDatabase);
    }

    /**
     * ONLY USE THIS FOR INITIALIZING THE ROW OBJECT.
     *
     * This function does not enforce ACL write privileges.
     * It shouldn't be used to fulfill data assignment on behalf of the user.
     * @param  mixed $rowData Row key/value pairs.
     *
     * @return RowGatewayInterface
     */
    public function exchangeArray($rowData)
    {
        // NOTE: Something we made select where the primary key is not involved
        // getting the read/unread/total from messages is an example
        $exists = ArrayUtils::contains($rowData, $this->primaryKeyColumn);

        return $this->populateSkipAcl($rowData, $exists);
    }

    /**
     * @return int
     *
     * @throws ForbiddenCollectionUpdateException
     * @throws \Exception
     */
    public function save()
    {
        // if (!$this->acl) {
            return parent::save();
        // }

        // =============================================================================
        // ACL Enforcement
        // -----------------------------------------------------------------------------
        // Note: Field Write Blacklists are enforced at the object setter level
        // BaseRowGateway::__set, BaseRowGateway::populate, BaseRowGateway::offsetSet)
        // =============================================================================

        $isCreating = !$this->rowExistsInDatabase();
        if ($isCreating) {
            $this->acl->enforceCreate($this->table);
        }

        // Enforce Privilege: "Little" Edit (I am the record CMS owner)
        $ownerFieldName = SchemaService::getCollectionOwnerFieldName($this->table);
        $cmsOwnerId = $this->acl->getRecordCmsOwnerId($this, $this->table);
        $currentUserId = $this->acl->getUserId();
        $canEdit = $this->acl->canUpdate($this->table);
        $canBigEdit = $this->acl->hasTablePrivilege($this->table, 'bigedit');

        // Enforce Privilege: "Big" Edit (I am not the record CMS owner)
        if ($cmsOwnerId !== $currentUserId && !$canBigEdit) {
            $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
            $recordOwner = (false === $cmsOwnerId) ? 'no magic owner column' : 'the CMS owner #' . $cmsOwnerId;
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

            throw new ForbiddenCollectionUpdateException($aclErrorPrefix . 'Table bigedit access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' and ' . $recordOwner . '.');
        }

        if (!$canEdit) {
            $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

            throw new ForbiddenCollectionUpdateException($aclErrorPrefix . 'Table edit access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' owned by the authenticated CMS user (#' . $cmsOwnerId . ').');
        }

        try {
            return parent::save();
        } catch (InvalidQueryException $e) {
            throw new \Exception('Error running save on this data: ' . print_r($this->data, true));
        }
    }

    public function delete()
    {
        if (!$this->acl) {
            return parent::delete();
        }

        // =============================================================================
        // ACL Enforcement
        // =============================================================================
        $currentUserId = $this->acl->getUserId();
        $cmsOwnerId = $this->acl->getRecordCmsOwnerId($this, $this->table);
        $canDelete = $this->acl->hasTablePrivilege($this->table, 'delete');
        $canBigDelete = $this->acl->hasTablePrivilege($this->table, 'bigdelete');

        // =============================================================================
        // Enforce Privilege: "Big" Delete (I am not the record CMS owner)
        // =============================================================================
        if ($cmsOwnerId !== $currentUserId && !$canBigDelete) {
            $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

            throw new ForbiddenCollectionDeleteException($aclErrorPrefix . 'Table harddelete access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' owned by the authenticated CMS user (#' . $cmsOwnerId . ').');
        }

        // =============================================================================
        // Enforce Privilege: "Little" Delete (I am the record CMS owner)
        // =============================================================================
        if (!$canDelete) {
            $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
            $recordOwner = (false === $cmsOwnerId) ? 'no magic owner column' : 'the CMS owner #' . $cmsOwnerId;
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

            throw new ForbiddenCollectionDeleteException($aclErrorPrefix . 'Table bigharddelete access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' and ' . $recordOwner . '.');
        }

        return parent::delete();
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
        if ($this->acl) {
            $this->acl->enforceReadField($this->table, $name);
        }

        return parent::__get($name);
    }

    /**
     * Offset get
     *
     * @param  string $offset
     *
     * @return mixed
     */
    public function offsetGet($offset)
    {
        // Confirm user group has read privileges on field with name $offset
        if ($this->acl) {
            $this->acl->enforceReadField($this->table, $offset);
        }

        return parent::offsetGet($offset);
    }

    /**
     * Offset set
     *
     * NOTE: Protecting this method protects self#__set, which calls this method in turn.
     *
     * @param  string $offset
     * @param  mixed $value
     *
     * @return RowGatewayInterface
     */
    public function offsetSet($offset, $value)
    {
        // Enforce field write blacklist
        if ($this->acl) {
            $this->acl->enforceWriteField($this->table, $offset);
        }

        return parent::offsetSet($offset, $value);
    }

    /**
     * Offset unset
     *
     * @param  string $offset
     *
     * @return RowGatewayInterface
     */
    public function offsetUnset($offset)
    {
        // Enforce field write blacklist
        if ($this->acl) {
            $this->acl->enforceWriteField($this->table, $offset);
        }

        return parent::offsetUnset($offset);
    }
}
