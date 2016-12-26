<?php

namespace Directus\Db\RowGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Acl\Exception\UnauthorizedTableBigDeleteException;
use Directus\Acl\Exception\UnauthorizedTableBigEditException;
use Directus\Acl\Exception\UnauthorizedTableDeleteException;
use Directus\Acl\Exception\UnauthorizedTableEditException;
use Directus\Auth\Provider as Auth;
use Directus\Util\Formatting;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\Exception\InvalidQueryException;
use Zend\Db\Sql\Sql;

class AclAwareRowGateway extends BaseRowGateway
{
    protected $acl;

    /**
     * Constructor
     * @param acl $acl
     * @param string $primaryKeyColumn
     * @param string|\Zend\Db\Sql\TableIdentifier $table
     * @param AdapterInterface|Sql $adapterOrSql
     * @throws \InvalidArgumentException
     */
    public function __construct(Acl $acl, $primaryKeyColumn, $table, $adapterOrSql)
    {
        $this->acl = $acl;
        parent::__construct($primaryKeyColumn, $table, $adapterOrSql);
    }

    public static function makeRowGatewayFromTableName($acl, $table, $adapter, $pkFieldName = 'id')
    {
        // @TODO: similar method to the parent class
        // Underscore to camelcase table name to namespaced row gateway classname,
        // e.g. directus_users => \Directus\Db\RowGateway\DirectusUsersRowGateway
        $rowGatewayClassName = Formatting::underscoreToCamelCase($table) . 'RowGateway';
        $rowGatewayClassName = __NAMESPACE__ . '\\' . $rowGatewayClassName;
        if (class_exists($rowGatewayClassName))
            return new $rowGatewayClassName($acl, $pkFieldName, $table, $adapter);
        return new self($acl, $pkFieldName, $table, $adapter);
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
     * @return AclAwareRowGateway
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
     * @return AclAwareRowGateway
     */
    public function exchangeArray($rowData)
    {
        return $this->populateSkipAcl($rowData, true);
    }

    public function save()
    {
        $this->initialize();

        $currentUserId = null;
        if (Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }

        /**
         * ACL Enforcement
         * Note: Field Write Blacklists are enforced at the object setter level
         * (AARG#__set, AARG#populate, AARG#offsetSet)
         */
        if (!$this->rowExistsInDatabase()) {
            /**
             * Enforce Privilege: Table Add
             */
            if (!$this->acl->hasTablePrivilege($this->table, 'add')) {
                $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                throw new UnauthorizedTableAddException($aclErrorPrefix . 'Table add access forbidden on table ' . $this->table);
            }
        } else {
            $cmsOwnerId = $this->acl->getRecordCmsOwnerId($this, $this->table);
            /**
             * Enforce Privilege: "Little" Edit (I am the record CMS owner)
             */
            if ($cmsOwnerId === intval($currentUserId)) {
                if (!$this->acl->hasTablePrivilege($this->table, 'edit')) {
                    $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
                    $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableEditException($aclErrorPrefix . 'Table edit access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' owned by the authenticated CMS user (#' . $cmsOwnerId . ').');
                }
            } /**
             * Enforce Privilege: "Big" Edit (I am not the record CMS owner)
             */
            else {
                if (!$this->acl->hasTablePrivilege($this->table, 'bigedit')) {
                    $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
                    $recordOwner = (false === $cmsOwnerId) ? 'no magic owner column' : 'the CMS owner #' . $cmsOwnerId;
                    $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableBigEditException($aclErrorPrefix . 'Table bigedit access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' and ' . $recordOwner . '.');
                }
            }
        }

        try {
            return parent::save();
        } catch (InvalidQueryException $e) {
            $this->logger()->fatal('Error running save on this data: ' . print_r($this->data, true));
            throw $e;
        }
    }

    public function delete()
    {
        /**
         * ACL Enforcement
         */
        $currentUserId = $this->acl->getUserId();
        $cmsOwnerId = $this->acl->getRecordCmsOwnerId($this, $this->table);
        $isCurrentUserOwner = $cmsOwnerId === $currentUserId;
        $canBigDelete = false;
        $canDelete = false;

        if (TableSchema::hasTableColumn($this->table, STATUS_COLUMN_NAME)) {
            if ($this->acl->hasTablePrivilege($this->table, 'bigdelete')) {
                $canBigDelete = true;
            } else if ($this->acl->hasTablePrivilege($this->table, 'delete')) {
                $canDelete = true;
            }
        }

        if (!$canDelete && !$canBigDelete) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . ' forbidden to hard delete on table `' . $this->table . '` because it has status column.');
        }

        /**
         * Enforce Privilege: "Little" Delete (I am the record CMS owner)
         */
        if ($isCurrentUserOwner && !$canDelete) {
            $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableDeleteException($aclErrorPrefix . 'Table harddelete access forbidden on `' . $this->table . '` table record with ' . $recordPk . ' owned by the authenticated CMS user (#' . $cmsOwnerId . ').');
        } elseif (!$isCurrentUserOwner && !$canBigDelete) {
            /**
             * Enforce Privilege: "Big" Delete (I am not the record CMS owner)
             */
            $recordPk = self::stringifyPrimaryKeyForRecordDebugRepresentation($this->primaryKeyData);
            $recordOwner = (false === $cmsOwnerId) ? 'no magic owner column' : 'the CMS owner #' . $cmsOwnerId;
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . 'Table bigharddelete access forbidden on `' . $this->table . '` table record with $recordPk and ' . $recordOwner . '.');
        }

        return parent::delete();
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
     *
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
     *
     * @return AclAwareRowGateway
     */
    public function offsetSet($offset, $value)
    {
        // Enforce field write blacklist
        $this->acl->enforceBlacklist($this->table, $offset, Acl::FIELD_WRITE_BLACKLIST);

        return parent::offsetSet($offset, $value);
    }

    /**
     * Offset unset
     *
     * @param  string $offset
     *
     * @return AclAwareRowGateway
     */
    public function offsetUnset($offset)
    {
        // Enforce field write blacklist
        $this->acl->enforceBlacklist($this->table, $offset, Acl::FIELD_WRITE_BLACKLIST);

        return parent::offsetUnset($offset);
    }
}
