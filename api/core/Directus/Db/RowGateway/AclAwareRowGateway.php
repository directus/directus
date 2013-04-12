<?php

namespace Directus\Db\RowGateway;

use Zend\Db\RowGateway\RowGateway;

use Directus\Bootstrap;
use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Acl\Exception\UnauthorizedFieldReadException;
use Directus\Acl\Exception\UnauthorizedFieldWriteException;

class AclAwareRowGateway extends RowGateway {

    protected $aclProvider;

    /**
     * Constructor
     * @param AclProvider $aclProvider
     * @param string $primaryKeyColumn
     * @param string|\Zend\Db\Sql\TableIdentifier $table
     * @param Adapter|Sql $adapterOrSql
     * @throws Exception\InvalidArgumentException
     */
    public function __construct(Acl $aclProvider, $primaryKeyColumn, $table, $adapterOrSql) {
        $this->aclProvider = $aclProvider;
        parent::__construct($primaryKeyColumn, $table, $adapterOrSql);
    }

    public static function makeRowGatewayFromTableName($aclProvider, $table, $adapter, $pkFieldName = 'id') {
        /**
         * Underscore to camelcase table name to namespaced row gateway classname,
         * e.g. directus_users => \Directus\Db\RowGateway\DirectusUsersRowGateway
         */
        $rowGatewayClassName = underscoreToCamelCase($table) . "RowGateway";
        $rowGatewayClassName = __NAMESPACE__ . "\\$rowGatewayClassName";
        if(class_exists($rowGatewayClassName))
            return new $rowGatewayClassName($aclProvider, $pkFieldName, $table, $adapter);
        return new self($aclProvider, $pkFieldName, $table, $adapter);
    }

    /**
     * OVERRIDES
     */

    public function save() {
        $this->initialize();

        /** Is the user group allowed to create new records? */
        if(!$this->rowExistsInDatabase() && !$this->aclProvider->hasTablePrivilege($this->table, 'add')) {
            throw new UnauthorizedTableAddException("Table add access forbidden on table " . $this->table);
        }

        return parent::save();
    }

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool  $rowExistsInDatabase
     * @return AbstractRowGateway
     */
    public function populate(array $rowData, $rowExistsInDatabase = false)
    {
        // Confirm user group has write privileges on field with name $offset
        $fieldWriteBlacklist = $this->aclProvider->getTablePrivilegeList($this->table, Acl::FIELD_WRITE_BLACKLIST);
        $forbiddenWriteIndices = array_intersect(array_keys($rowData), $fieldWriteBlacklist);
        if(count($forbiddenWriteIndices)) {
            $forbiddenWriteIndices = implode(", ", $forbiddenWriteIndices);
            throw new UnauthorizedFieldWriteException("Write (set) access forbidden to indices $forbiddenWriteIndices on table \"{$this->table}\"");
        }
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
        // Confirm user group has read privileges on field with name $offset
        $censorFields = $this->aclProvider->getTablePrivilegeList($this->table, Acl::FIELD_READ_BLACKLIST);
        if(in_array($name, $censorFields))
            throw new UnauthorizedFieldReadException("Read access forbidden to index \"$name\" on table \"{$this->table}\"");
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
        $censorFields = $this->aclProvider->getTablePrivilegeList($this->table, Acl::FIELD_READ_BLACKLIST);
        if(in_array($offset, $censorFields))
            throw new UnauthorizedFieldReadException("Read access forbidden to index \"$offset\" on table \"{$this->table}\"");
        return parent::offsetGet($offset);
    }

    /**
     * Offset set
     *
     * @param  string $offset
     * @param  mixed $value
     * @return RowGateway
     */
    public function offsetSet($offset, $value)
    {
        // Confirm user group has write privileges on field with name $offset
        $fieldWriteBlacklist = $this->aclProvider->getTablePrivilegeList($this->table, Acl::FIELD_WRITE_BLACKLIST);
        if(in_array($offset, $fieldWriteBlacklist))
            throw new UnauthorizedFieldWriteException("Write (set) access forbidden to index \"$offset\" on table \"{$this->table}\"");
        return parent::offsetSet($offset, $value);
    }

    /**
     * Offset unset
     *
     * @param  string $offset
     * @return AbstractRowGateway
     */
    public function offsetUnset($offset)
    {
        // Confirm user group has write privileges on field with name $offset
        $fieldWriteBlacklist = $this->aclProvider->getTablePrivilegeList($this->table, Acl::FIELD_WRITE_BLACKLIST);
        if(in_array($offset, $fieldWriteBlacklist))
            throw new UnauthorizedFieldWriteException("Write (unset) access forbidden to index \"$offset\" on table \"{$this->table}\"");
        return parent::offsetUnset($offset);
    }

    /**
     * To array
     *
     * @return array
     */
    public function toArray()
    {
        // ... omit the fields we can't read
        $data = $this->aclProvider->censorFields($this->table, $this->data);
        return $data;
    }

    /**
     * HELPER FUNCTIONS
     */

    // as opposed to toArray()
    // used only for proof of concept
    public function __getUncensoredDataForTesting() {
        return $this->data;
    }

    private function logger() {
        return Bootstrap::get('app')->getLog();
    }

}