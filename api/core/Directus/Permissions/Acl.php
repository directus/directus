<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Permissions;

use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Permissions\Exception\UnauthorizedFieldReadException;
use Directus\Permissions\Exception\UnauthorizedFieldWriteException;
use Directus\Util\ArrayUtils;
use Zend\Db\RowGateway\RowGateway;
use Zend\Db\Sql\Predicate\PredicateSet;
use Zend\Db\Sql\Select;

/**
 * ACL
 *
 * @author Daniel Bickett <daniel@rngr.org>
 * @author Welling Guzmán <welling@rngr.org>
 */
class Acl
{
    const TABLE_PERMISSIONS = 'permissions';
    const FIELD_READ_BLACKLIST = 'read_field_blacklist';
    const FIELD_WRITE_BLACKLIST = 'write_field_blacklist';
    const PERMISSION_FULL = [
        'allow_view' => 2,
        'allow_add' => 1,
        'allow_edit' => 2,
        'allow_delete' => 2,
        'allow_alter' => 1
    ];
    const PERMISSION_READ = [
        'allow_view' => 2,
        'allow_add' => 0,
        'allow_edit' => 0,
        'allow_delete' => 0,
        'allow_alter' => 0
    ];
    const PERMISSION_WRITE = [
        'allow_view' => 2,
        'allow_add' => 1,
        'allow_edit' => 2,
        'allow_delete' => 0,
        'allow_alter' => 0
    ];
    const PERMISSION_NONE = [
        'allow_view' => 0,
        'allow_add' => 0,
        'allow_edit' => 0,
        'allow_delete' => 0,
        'allow_alter' => 0
    ];

    /**
     * The magic Directus column identifying the record's CMS owner.
     * NOTE: Out of use, in favor of the transitional mapper below.
     * @see  self::$cms_owner_columns_by_table and self#getRecordCmsOwnerId
     */
    const ROW_OWNER_COLUMN = 'directus_user';

    public static $cms_owner_columns_by_table = [
        'directus_files' => 'user',
        'directus_preferences' => 'user',
        'directus_messages_recipients' => 'recipient',
        'directus_users' => 'id'
    ];

    /**
     * Baseline/fallback ACL
     * @var array
     */
    public static $base_acl = [
        self::TABLE_PERMISSIONS => ['add', 'edit', 'delete', 'view'],
        self::FIELD_READ_BLACKLIST => [],
        self::FIELD_WRITE_BLACKLIST => []
    ];

    /**
     * These fields cannot be included on any FIELD_READ_BLACKLIST. (It is required
     * that they are readable in order for the application to function.)
     * @var array
     */
    public static $mandatory_read_lists = [
        // key: table name ('*' = all tables, baseline definition)
        // value: array of column names
        '*' => ['id', STATUS_COLUMN_NAME],
        'directus_activity' => ['user'],
        'directus_files' => ['user']
    ];

    /**
     * Group privileges grouped by table name
     *
     * @var array
     */
    protected $groupPrivileges;

    /**
     * Authenticated user id
     *
     * @var int|null
     */
    protected $userId = null;

    /**
     * Authenticated user group  id
     *
     * @var int|null
     */
    protected $groupId = null;

    /**
     * Flag to determine whether the user is public or not
     *
     * @var bool
     */
    protected $isPublic = null;

    public function __construct(array $groupPrivileges = [])
    {
        $this->setGroupPrivileges($groupPrivileges);
    }

    /**
     * Sets the authenticated user id
     *
     * @param $userId
     */
    public function setUserId($userId)
    {
        $this->userId = (int)$userId;
    }

    /**
     * Sets the authenticated group id
     *
     * @param $groupId
     */
    public function setGroupId($groupId)
    {
        $this->groupId = (int)$groupId;
    }

    /**
     * Sets whether the authenticated user is public
     *
     * @param $public
     */
    public function setPublic($public)
    {
        $this->isPublic = (bool)$public;
    }

    /**
     * Gets the authenticated user id
     *
     * @return int|null
     */
    public function getUserId()
    {
        return $this->userId;
    }

    /**
     * Gets the authenticated group id
     *
     * @return int|null
     */
    public function getGroupId()
    {
        return $this->groupId;
    }

    /**
     * Gets whether the authenticated user is public
     *
     * @return bool
     */
    public function isPublic()
    {
        return $this->isPublic === true;
    }

    /**
     * Gets whether the authenticated user is admin
     *
     * @return bool
     */
    public function isAdmin()
    {
        return $this->getGroupId() === 1;
    }

    public function getFullPermission()
    {
        return [
            ''
        ];
    }

    /**
     * Sets the group tables privileges
     *
     * @param array $groupPrivileges
     *
     * @return $this
     */
    public function setGroupPrivileges(array $groupPrivileges)
    {
        $fixedPrivileges = $this->getFixedGroupPrivileges();
        $this->groupPrivileges = ArrayUtils::defaults($groupPrivileges, $fixedPrivileges);

        return $this;
    }

    public function setTablePrivileges($tableName, array $privileges)
    {
        $this->groupPrivileges[$tableName] = $privileges;
    }

    /**
     * Gets the fixed group privileges
     *
     * @return array
     */
    public function getFixedGroupPrivileges()
    {
        return [
            'directus_preferences' => [
                'allow_add' => 1,
                'allow_view' => 1,
                'allow_edit' => 1
            ]
        ];
    }

    /**
     * Gets the group tables privileges
     *
     * @return array
     */
    public function getGroupPrivileges()
    {
        return $this->groupPrivileges;
    }

    public function isTableListValue($value)
    {
        return array_key_exists($value, self::$base_acl);
    }

    public function getTableMandatoryReadList($table)
    {
        $list = self::$mandatory_read_lists['*'];
        if (array_key_exists($table, self::$mandatory_read_lists)) {
            $list = array_merge($list, self::$mandatory_read_lists[$table]);
        }
        return $list;
    }

    public function getErrorMessagePrefix()
    {
        // %s and not %d so that null will appear as "null"
        $aclErrorPrefix = '[Group #%s User #%s] ';
        $aclErrorPrefix = sprintf($aclErrorPrefix, $this->getGroupId(), $this->getUserId());
        return $aclErrorPrefix;
    }

    /**
     * Checks whether the user can add record in the given table
     *
     * @param $tableName
     *
     * @return bool
     */
    public function canAdd($tableName)
    {
        return $this->hasTablePrivilege($tableName, 'add');
    }

    /**
     * Checks whether the user can view the given table
     *
     * @param $tableName
     *
     * @return bool
     */
    public function canView($tableName)
    {
        return $this->hasTablePrivilege($tableName, 'view');
    }

    /**
     * Checks whether the user can view the given table
     *
     * @param $tableName
     *
     * @return bool
     */
    public function canEdit($tableName)
    {
        return $this->hasTablePrivilege($tableName, 'edit');
    }

    /**
     * Can the user alter the given table
     *
     * @param $tableName
     *
     * @return bool
     */
    public function canAlter($tableName)
    {
        return $this->hasTablePrivilege($tableName, 'alter');
    }

    public function enforceAdd($tableName)
    {
        if (!$this->canAdd($tableName)) {
            $aclErrorPrefix = $this->getErrorMessagePrefix();
            throw new Exception\UnauthorizedTableAddException($aclErrorPrefix . 'Table add access forbidden on table ' . $tableName);
        }
    }

    public function enforceAlter($tableName)
    {
        if (!$this->canAlter($tableName)) {
            $aclErrorPrefix = $this->getErrorMessagePrefix();
            throw new Exception\UnauthorizedTableAlterException($aclErrorPrefix . 'Table alter access forbidden on table ' . $tableName);
        }
    }

    /**
     * Checks whether the user can see the given column
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     */
    public function canReadColumn($tableName, $columnName)
    {
        $readFieldBlacklist = $this->getTablePrivilegeList($tableName, static::FIELD_READ_BLACKLIST);

        return !in_array($columnName, $readFieldBlacklist);
    }

    /**
     * Checks whether the user can see the given column
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     */
    public function canWriteColumn($tableName, $columnName)
    {
        $writeFieldBlacklist = $this->getTablePrivilegeList($tableName, static::FIELD_WRITE_BLACKLIST);

        return !in_array($columnName, $writeFieldBlacklist);
    }

    /**
     * Confirm current user group has $blacklist privileges on fields in $offsets
     * NOTE: Acl#getTablePrivilegeList enforces that $blacklist is a correct value
     * @param  array|string $offsets One or more string table field names
     * @param  integer $blacklist One of \Directus\Permissions\Acl's blacklist constants
     * @throws  UnauthorizedFieldWriteException If the specified $offsets intersect with $table's field write blacklist
     * @throws  UnauthorizedFieldReadException If the specified $offsets intersect with $table's field read blacklist
     * @return  null
     */
    public function enforceBlacklist($table, $offsets, $blacklist)
    {
        $offsets = is_array($offsets) ? $offsets : [$offsets];
        $fieldBlacklist = $this->getTablePrivilegeList($table, $blacklist);
        /**
         * Enforce catch-all offset attempts.
         */
        if (self::FIELD_READ_BLACKLIST === $blacklist && count($fieldBlacklist) && in_array('*', $offsets)) {
            // Cannot select all, given a non-empty field read blacklist.
            $prefix = $this->getErrorMessagePrefix();
            throw new UnauthorizedFieldReadException($prefix . 'Cannot select all (`*`) from table ' . $table . ' with non-empty read field blacklist.');
        }
        /**
         * Enforce granular offset attempts.
         * NOTE: array_intersect attempts to convert all array items to a string, causing exceptions
         * if $offsets contains objects such as Zend\Db\Sql\Expression
         * @todo How should ACL react to Expression objects?
         */
        $forbiddenIndices = [];
        foreach ($offsets as $offset) {
            if (in_array($offset, $fieldBlacklist)) {
                $forbiddenIndices[] = $offset;
            }
        }
        if (count($forbiddenIndices)) {
            $forbiddenIndices = implode(', ', $forbiddenIndices);
            switch ($blacklist) {
                case self::FIELD_WRITE_BLACKLIST:
                    $prefix = $this->getErrorMessagePrefix();
                    throw new UnauthorizedFieldWriteException($prefix . __t('write_access_forbidden_to_table_x_indices_y', [
                            'table' => $table,
                            'indices' => $forbiddenIndices
                        ]));
                case self::FIELD_READ_BLACKLIST:
                    $prefix = $this->getErrorMessagePrefix();
                    throw new UnauthorizedFieldReadException($prefix . __t('read_access_forbidden_to_table_x_indices_y', [
                            'table' => $table,
                            'indices' => $forbiddenIndices
                        ]));
            }
        }

        return null;
    }

    /**
     * Given the loaded group privileges, yield the given privilege-/black-list type for the given table.
     * @param  string $table Table name.
     * @param  integer $list The privilege list type (Class constant, ::FIELD_*_BLACKLIST or ::TABLE_PERMISSIONS)
     * @return array Array of string table privileges / table blacklist fields, depending on $list.
     * @throws  \InvalidArgumentException If $list is not a known value.
     */
    public function getTablePrivilegeList($table, $list)
    {
        if (!$this->isTableListValue($list)) {
            throw new \InvalidArgumentException(__t('invalid_list_x', ['list' => $list]));
        }
        $privilegeList = self::$base_acl[$list];
        $groupHasTablePrivileges = array_key_exists($table, $this->groupPrivileges);
        if (!$groupHasTablePrivileges && array_key_exists('*', $this->groupPrivileges)) {
            $groupHasTablePrivileges = true;
            $table = '*';
        }

        // @TODO: remove permissions.
        if ($list === 'permissions') {
            $permissionFields = array_merge(self::$base_acl[self::TABLE_PERMISSIONS], [
                'alter'
            ]);
            $permissionFields = array_map(function ($name) {
                return 'allow_' . $name;
            }, $permissionFields);

            if ($groupHasTablePrivileges) {
                $privilegeList = array_intersect_key($this->groupPrivileges[$table], array_flip($permissionFields));
            } else if (array_key_exists('*', $this->groupPrivileges)) {
                return $this->getTablePrivilegeList('*', self::TABLE_PERMISSIONS);
            } else {
                $privilegeList = [];
                foreach ($permissionFields as $permission) {
                    $privilegeList[$permission] = 0;
                }
            }

            return $privilegeList;
        }

        if ($groupHasTablePrivileges) {
            $privilegeList = ArrayUtils::get($this->groupPrivileges, $table . '.' . $list, []);
            if (!is_array($privilegeList)) {
                throw new \RuntimeException(__t('expected_permission_list_x_for_table_y_to_be_set_and_type_array', [
                    'list' => $list,
                    'table' => $table
                ]));
            }
        } else {
            $groupHasFallbackTablePrivileges = array_key_exists('*', $this->groupPrivileges);
            if ($groupHasFallbackTablePrivileges) {
                if (!isset($this->groupPrivileges['*'][$list]) || !is_array($this->groupPrivileges['*'][$list])) {
                    throw new \RuntimeException(__t('expected_permission_list_x_for_table_y_to_be_set_and_type_array', [
                        'list' => $list,
                        'table' => $table
                    ]));
                }
                $privilegeList = $this->groupPrivileges['*'][$list];
            }
        }

        if (self::FIELD_READ_BLACKLIST === $privilegeList) {
            // Filter mandatory read fields from read blacklists
            $mandatoryReadFields = $this->getTableMandatoryReadList($table);
            $disallowedReadBlacklistFields = array_intersect($mandatoryReadFields, $privilegeList);
            if (count($disallowedReadBlacklistFields)) {
                trigger_error(
                    __t('table_x_contains_read_blacklist_items_which_are_designated_as_mandatory_read_fields', ['table' => $table])
                    . ': ' . print_r($disallowedReadBlacklistFields, true)
                );
                // Filter out mandatory read items
                $privilegeList = array_diff($privilegeList, $mandatoryReadFields);
            }
        }

        // Remove null values
        return array_filter($privilegeList);
    }

    public function censorFields($table, $data)
    {
        $censorFields = $this->getTablePrivilegeList($table, self::FIELD_READ_BLACKLIST);
        foreach ($censorFields as $key) {
            if (array_key_exists($key, $data)) {
                unset($data[$key]);
            }
        }
        return $data;
    }

    /**
     * Given table name $table and privilege constant $privilege, return boolean
     * value indicating whether the current user group has permission to perform
     * the specified table-level action on the specified table.
     *
     * @param  string $table Table name
     * @param  string $privilege Privilege constant defined by \Directus\Permissions\Acl
     *
     * @return boolean
     */
    public function hasTablePrivilege($table, $privilege)
    {
        $tablePermissions = $this->getTablePrivilegeList($table, self::TABLE_PERMISSIONS);
        $permissionLevel = 1;
        $permissionName = $privilege;

        if (strpos($privilege, 'big') === 0) {
            $permissionLevel = 2;
            $permissionName = substr($privilege, 3);
        }

        if (isset($tablePermissions['allow_' . $permissionName])) {
            return $permissionLevel <= $tablePermissions['allow_' . $permissionName];
        }

        return false;
    }

    public function getCmsOwnerColumnByTable($table)
    {
        if (!array_key_exists($table, self::$cms_owner_columns_by_table)) {
            return false;
        }

        return self::$cms_owner_columns_by_table[$table];
    }

    /**
     * Given $record, yield the ID contained by that $table's CMS owner column,
     * if one exists. Otherwise return false.
     *
     * @param  \Zend\Db\RowGateway\RowGateway|array $record
     * @param  string $table The name of the record's table.
     *
     * @return int|false
     */
    public function getRecordCmsOwnerId($record, $table)
    {
        $isRowGateway = $record instanceof RowGateway || is_subclass_of($record, 'Zend\Db\RowGateway\RowGateway');
        if (!$isRowGateway && !is_array($record)) {
            // @TODO: get_class only works on object
            // if $record is an array get_class will return false
            throw new \InvalidArgumentException(
                sprintf('Record must be an array or a RowGateway. %s was given.',
                    is_object($record) ? get_class($record) : gettype($record)
                )
            );
        }

        $ownerColumnName = $this->getCmsOwnerColumnByTable($table);

        if (false === $ownerColumnName) {
            return false;
        }

        if ($isRowGateway && !$record->offsetExists($ownerColumnName)) {
            return false;
        } elseif (is_array($record) && !array_key_exists($ownerColumnName, $record)) {
            return false;
        }

        return (int) $record[$ownerColumnName];
    }

    public function getCmsOwnerIdsByTableGatewayAndPredicate(BaseTableGateway $TableGateway, PredicateSet $predicate)
    {
        $ownerIds = [];
        $table = $TableGateway->getTable();
        $cmsOwnerColumn = $this->getCmsOwnerColumnByTable($table);
        $select = new Select($table);
        $select
            ->columns([$TableGateway->primaryKeyFieldName, $cmsOwnerColumn]);
        $select->where($predicate);
        $results = $TableGateway->ignoreFilters()->selectWith($select);
        foreach ($results as $row) {
            $ownerIds[] = $row[$cmsOwnerColumn];
        }

        return [count($results), $ownerIds];
    }
}
