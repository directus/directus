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
     * HELPER FUNCTIONS
     */

    /**
     * Confirm user group has $blacklist privileges on fields in $offsets
     * @param  array|string $offsets  One or more string table field names
     * @param  integer $blacklist  One of \Directus\Acl\Acl's blacklist constants
     * @throws  UnauthorizedFieldWriteException If the specified $offsets intersect with this table's field write blacklist
     * @throws  UnauthorizedFieldReadException If the specified $offsets intersect with this table's field read blacklist
     * @return  null
     */
    private function enforceBlacklist($offsets, $blacklist) {
        $offsets = is_array($offsets) ? $offsets : array($offsets);
        // Acl#getTablePrivilegeList enforces that $blacklist is a correct value
        $fieldBlacklist = $this->aclProvider->getTablePrivilegeList($this->table, $blacklist);
        $forbiddenIndices = array_intersect($offsets, $fieldBlacklist);
        if(count($forbiddenIndices)) {
            $forbiddenIndices = implode(", ", $forbiddenIndices);
            switch($blacklist) {
                case Acl::FIELD_WRITE_BLACKLIST:
                    throw new UnauthorizedFieldWriteException("Write (set) access forbidden to table \"{$this->table}\" indices: $forbiddenIndices");
                case Acl::FIELD_READ_BLACKLIST:
                    throw new UnauthorizedFieldReadException("Read (get) access forbidden to table \"{$this->table}\" indices: $forbiddenIndices");
            }
        }
    }

    // as opposed to toArray()
    // used only for proof of concept
    public function __getUncensoredDataForTesting() {
        return $this->data;
    }

    private function logger() {
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
    private function populateSkipAcl($rowData) {
        $this->data = $rowData;
        return $this;
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
        return $this->populateSkipAcl($rowData);
    }

    public function save() {
        $this->initialize();
        // Enforce Privilege: Table Add
        if(!$this->rowExistsInDatabase() && !$this->aclProvider->hasTablePrivilege($this->table, 'add'))
            throw new UnauthorizedTableAddException("Table add access forbidden on table " . $this->table);
        return parent::save();
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
        // Enforce field write blacklist
        $attemptOffsets = array_keys($rowData);
        $this->enforceBlacklist($attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);
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
        $this->enforceBlacklist($name, ACL::FIELD_READ_BLACKLIST);
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
        // Confirm user group has read privileges on field with name $name
        $this->enforceBlacklist($offset, ACL::FIELD_READ_BLACKLIST);
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
        // Enforce field write blacklist
        $this->enforceBlacklist($offset, Acl::FIELD_WRITE_BLACKLIST);
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
        // Enforce field write blacklist
        $this->enforceBlacklist($offset, Acl::FIELD_WRITE_BLACKLIST);
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

}