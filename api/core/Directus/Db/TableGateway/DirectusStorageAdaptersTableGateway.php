<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;

class DirectusStorageAdaptersTableGateway extends AclAwareTableGateway
{

    public static $_tableName = 'directus_storage_adapters';

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    /**
     * @param  string $string Potentially valid JSON.
     * @return array
     */
    protected function jsonDecodeIfPossible($string)
    {
        if (!empty($string) && $decoded = json_decode($string, true)) {
            return $decoded;
        }
        return array();
    }

    public function fetchByUniqueRoles(array $roleNames)
    {
        $select = new Select(self::$_tableName);
        $select->group('role');
        $select->where->in('role', $roleNames);
        $rows = $this->selectWith($select);
        $roles = array();
        foreach ($rows as $row) {
            $row = $row->toArray();
            // The adapter's `params` column is JSON serialized.
            $row['params'] = $this->jsonDecodeIfPossible($row['params']);
            $roles[$row['role']] = $row;
        }
        return $roles;
    }

    public function fetchOneByKey($key)
    {
        $select = new Select(self::$_tableName);
        $select->limit(1);
        $select->where->equalTo('key', $key);
        $row = $this->selectWith($select)->current();
        if (!$row) {
            return false;
        }
        $row = $row->toArray();
        // The adapter's `params` column is JSON serialized.
        $row['params'] = $this->jsonDecodeIfPossible($row['params']);
        return $row;
    }

    public function fetchOneById($id)
    {
        $select = new Select(self::$_tableName);
        $select->limit(1);
        $select->where->equalTo('id', $id);
        $row = $this->selectWith($select)->current();
        if (!$row) {
            return false;
        }
        $row = $row->toArray();
        // The adapter's `params` column is JSON serialized.
        $row['params'] = $this->jsonDecodeIfPossible($row['params']);
        return $row;
    }

    /**
     * Used by Directus front-controller to expose the storage adapters to the front-end. For this reason we exclude
     * the `params` field which can contain private information, such as API usernames and secret keys.
     * @return array
     */
    public function fetchAllByIdNoParams()
    {
        $all = $this->select()->toArray();
        $allByKey = array();
        foreach ($all as $row) {
            unset($row['params']);
            $allByKey[$row['id']] = $row;
        }
        return $allByKey;
    }

}
