<?php

namespace Directus\Permissions;

use Directus\Permissions\Exception\ForbiddenCommentCreateException;
use Directus\Permissions\Exception\ForbiddenCommentDeleteException;
use Directus\Permissions\Exception\ForbiddenCommentUpdateException;
use Directus\Permissions\Exception\ForbiddenFieldReadException;
use Directus\Permissions\Exception\ForbiddenFieldWriteException;
use Directus\Exception\UnauthorizedException;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;

class Acl
{
    const ACTION_CREATE = 'create';
    const ACTION_READ   = 'read';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';

    const LEVEL_NONE = 'none';
    const LEVEL_MINE = 'mine';
    const LEVEL_ROLE = 'role';
    const LEVEL_FULL = 'full';

    const COMMENT_LEVEL_NONE   = 'none';
    const COMMENT_LEVEL_CREATE = 'create';
    const COMMENT_LEVEL_UPDATE = 'update';
    const COMMENT_LEVEL_FULL   = 'full';

    const EXPLAIN_LEVEL_NONE   = 'none';
    const EXPLAIN_LEVEL_CREATE = 'create';
    const EXPLAIN_LEVEL_UPDATE = 'update';
    const EXPLAIN_LEVEL_ALWAYS = 'always';

    const FIELD_READ_BLACKLIST = 'read_field_blacklist';
    const FIELD_WRITE_BLACKLIST = 'write_field_blacklist';

    const PERMISSION_FULL = [
        self::ACTION_CREATE => self::LEVEL_FULL,
        self::ACTION_READ   => self::LEVEL_FULL,
        self::ACTION_UPDATE => self::LEVEL_FULL,
        self::ACTION_DELETE => self::LEVEL_FULL
    ];

    const PERMISSION_NONE = [
        self::ACTION_CREATE => self::LEVEL_NONE,
        self::ACTION_READ   => self::LEVEL_NONE,
        self::ACTION_UPDATE => self::LEVEL_NONE,
        self::ACTION_DELETE => self::LEVEL_NONE
    ];

    const PERMISSION_READ = [
        self::ACTION_CREATE => self::LEVEL_NONE,
        self::ACTION_READ   => self::LEVEL_FULL,
        self::ACTION_UPDATE => self::LEVEL_NONE,
        self::ACTION_DELETE => self::LEVEL_NONE
    ];

    const PERMISSION_WRITE = [
        self::ACTION_CREATE => self::LEVEL_FULL,
        self::ACTION_READ   => self::LEVEL_NONE,
        self::ACTION_UPDATE => self::LEVEL_FULL,
        self::ACTION_DELETE => self::LEVEL_NONE
    ];

    const PERMISSION_READ_WRITE = [
        self::ACTION_CREATE => self::LEVEL_FULL,
        self::ACTION_READ   => self::LEVEL_FULL,
        self::ACTION_UPDATE => self::LEVEL_FULL,
        self::ACTION_DELETE => self::LEVEL_NONE
    ];

    protected $permissionLevelsMapping = [
        self::LEVEL_NONE => 0,
        self::LEVEL_MINE => 1,
        self::LEVEL_ROLE => 2,
        self::LEVEL_FULL => 3
    ];

    protected $commentLevelsMapping = [
        self::COMMENT_LEVEL_NONE => 0,
        self::COMMENT_LEVEL_CREATE => 1,
        self::COMMENT_LEVEL_UPDATE => 2,
        self::COMMENT_LEVEL_FULL => 3
    ];

    /**
     * Permissions by status grouped by collection
     *
     * @var array
     */
    protected $statusPermissions = [];

    /**
     * Permissions grouped by collection
     *
     * @var array
     */
    protected $globalPermissions = [];

    /**
     * Permissions by custom "status" grouped by collections
     *
     * @var array
     */
    protected $customPermissions = [];

    /**
     * Authenticated user id
     *
     * @var int|null
     */
    protected $userId = null;

    /**
     * @var string
     */
    protected $userEmail;

    /**
     * @var string
     */
    protected $userFullName;

    /**
     * List of roles id the user beings to
     *
     * @var array
     */
    protected $roleIds = [];

    /**
     * List of allowed IPs by role
     *
     * @var array
     */
    protected $rolesIpWhitelist = [];

    /**
     * Flag to determine whether the user is public or not
     *
     * @var bool
     */
    protected $isPublic = null;

    public function __construct(array $permissions = [])
    {
        $this->setPermissions($permissions);
    }

    /**
     * Sets the authenticated user id
     *
     * @param $userId
     */
    public function setUserId($userId)
    {
        $this->userId = (int) $userId;
    }

    /**
     * Sets the authenticated user email
     *
     * @param string $email
     */
    public function setUserEmail($email)
    {
        $this->userEmail = $email;
    }

    /**
     * Sets the authenticated user full name
     *
     * @param string $name
     */
    public function setUserFullName($name)
    {
        $this->userFullName = $name;
    }

    /**
     * Sets whether the authenticated user is public
     *
     * @param $public
     */
    public function setPublic($public)
    {
        $this->isPublic = (bool) $public;
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
     * Returns authenticated user email
     *
     * @return string
     */
    public function getUserEmail()
    {
        return $this->userEmail;
    }

    /**
     * Returns authenticated user full name
     *
     * @return string
     */
    public function getUserFullName()
    {
        return $this->userFullName;
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
        return $this->hasAdminRole();
    }

    /**
     * Checks whether or not the user has admin role
     *
     * @return bool
     */
    public function hasAdminRole()
    {
        return $this->hasRole(1);
    }

    /**
     * Checks whether or not the user has the given role id
     *
     * @param int $roleId
     *
     * @return bool
     */
    public function hasRole($roleId)
    {
        return in_array($roleId, $this->getRolesId());
    }

    /**
     * Get all role IDs
     *
     * @return array
     */
    public function getRolesId()
    {
        return $this->roleIds;
    }

    /**
     * Sets the user roles ip whitelist
     *
     * @param array $rolesIpWhitelist
     */
    public function setRolesIpWhitelist(array $rolesIpWhitelist)
    {
        foreach ($rolesIpWhitelist as $role => $ipList) {
            if (!is_array($ipList)) {
                $ipList = explode(',', $ipList);
            }

            $this->rolesIpWhitelist[$role] = $ipList;
        }
    }

    /**
     * Checks whether or not the given ip is allowed in one of the roles
     *
     * @param $ip
     *
     * @return bool
     */
    public function isIpAllowed($ip)
    {
        $allowed = true;
        foreach ($this->rolesIpWhitelist as $list) {
            if (!empty($list) && !in_array($ip, $list)) {
                $allowed = false;
                break;
            }
        }

        return $allowed;
    }

    /**
     * Sets the group permissions
     *
     * @param array $permissions
     *
     * @return $this
     */
    public function setPermissions(array $permissions)
    {
        foreach ($permissions as $collection => $collectionPermissions) {
            foreach ($collectionPermissions as $permission) {
                $roleId = ArrayUtils::get($permission, 'role');

                if (!in_array($roleId, $this->roleIds)) {
                    $this->roleIds[] = $roleId;
                }
            }

            $this->setCollectionPermissions($collection, $collectionPermissions);
        }

        return $this;
    }

    /**
     * Sets permissions to the given collection
     *
     * @param string $collection
     * @param array $permissions
     */
    public function setCollectionPermissions($collection, array $permissions)
    {
        foreach ($permissions as $permission) {
            $this->setCollectionPermission($collection, $permission);
        }
    }

    /**
     * Sets a collection permission
     *
     * @param $collection
     * @param array $permission
     *
     * @return $this
     */
    public function setCollectionPermission($collection, array $permission)
    {
        $status = ArrayUtils::get($permission, 'status');

        if (is_null($status) && !isset($this->globalPermissions[$collection])) {
            $this->globalPermissions[$collection] = $permission;
        } else if (!is_null($status) && StringUtils::startsWith($status, '$')) {
            $this->customPermissions[$collection][$status] = $permission;
        } else if (!is_null($status) && !isset($this->statusPermissions[$collection][$status])) {
            $this->statusPermissions[$collection][$status] = $permission;
            unset($this->globalPermissions[$collection]);
        }

        return $this;
    }

    /**
     * Gets the group permissions
     *
     * @return array
     */
    public function getPermissions()
    {
        return array_merge($this->globalPermissions, $this->statusPermissions);
    }

    /**
     * Returns all permissions no grouped by collection or statuses
     *
     * @return array
     */
    public function getAllPermissions()
    {
        $allPermissions = array_values($this->globalPermissions);

        foreach ($this->statusPermissions as $collection => $permissions) {
            $allPermissions = array_merge($allPermissions, array_values($permissions));
        }

        foreach ($this->customPermissions as $collection => $permissions) {
            $allPermissions = array_merge($allPermissions, array_values($permissions));
        }

        return $allPermissions;
    }

    public function getCollectionStatuses($collection)
    {
        $statuses = null;
        $permissions = ArrayUtils::get($this->statusPermissions, $collection);
        if (!empty($permissions)) {
            $statuses = array_keys($permissions);
        }

        return $statuses;
    }

    /**
     * Gets a collection permissions
     *
     * @param string $collection
     *
     * @return array
     */
    public function getCollectionPermissions($collection)
    {
        if (array_key_exists($collection, $this->statusPermissions)) {
            return $this->statusPermissions[$collection];
        } else if (array_key_exists($collection, $this->globalPermissions)) {
            return $this->globalPermissions[$collection];
        }

        return [];
    }

    /**
     * Gets a collection permission
     *
     * @param string $collection
     * @param null|int|string $status
     *
     * @return array
     */
    public function getPermission($collection, $status = null)
    {
        $permissions = $this->getCollectionPermissions($collection);
        $hasStatusPermissions = array_key_exists($collection, $this->statusPermissions);

        if (is_null($status) && $hasStatusPermissions) {
            $permissions = [];
        } else if ($hasStatusPermissions) {
            $permissions = ArrayUtils::get($permissions, $status, []);
        }

        return $permissions;
    }

    /**
     * Checks whether or not the collection has permissions by status
     *
     * @param string $collection
     *
     * @return bool
     */
    public function hasWorkflowEnabled($collection)
    {
        return array_key_exists($collection, $this->statusPermissions);
    }

    /**
     * Gets the given type (read/write) field blacklist
     *
     * @param string $type
     * @param string $collection
     * @param mixed $status
     *
     * @return array
     */
    public function getFieldBlacklist($type, $collection, $status = null)
    {
        $permission = $this->getPermission($collection, $status);

        switch ($type) {
            case static::FIELD_READ_BLACKLIST:
                $fields = ArrayUtils::get($permission, static::FIELD_READ_BLACKLIST);
                break;
            case static::FIELD_WRITE_BLACKLIST:
                $fields = ArrayUtils::get($permission, static::FIELD_WRITE_BLACKLIST);
                break;
            default:
                $fields = [];
        }

        return $fields ?: [];
    }

    /**
     * Gets the read field blacklist
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return array
     */
    public function getReadFieldBlacklist($collection, $status = null)
    {
        return $this->getFieldBlacklist(static::FIELD_READ_BLACKLIST, $collection, $status);
    }

    /**
     * Gets the write field blacklist
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return array|mixed
     */
    public function getWriteFieldBlacklist($collection, $status = null)
    {
        return $this->getFieldBlacklist(static::FIELD_WRITE_BLACKLIST, $collection, $status);
    }

    /**
     * Checks whether the user can add an item in the given collection
     *
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canCreate($collection, $status = null)
    {
        return $this->allowTo(static::ACTION_CREATE, static::LEVEL_MINE, $collection, $status);
    }

    /**
     * Checks whether the user can view an item in the given collection
     *
     * @param int $level
     * @param $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canReadAt($level, $collection, $status = null)
    {
        return $this->allowTo(static::ACTION_READ, $level, $collection, $status);
    }

    /**
     * Checks whether the user can read at least their own items in the given collection
     *
     * @param $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canRead($collection, $status = null)
    {
        return $this->canReadMine($collection, $status);
    }

    /**
     * Checks whether the user can read at least in one permission level no matter the status
     *
     * @param string $collection
     *
     * @return bool
     */
    public function canReadOnce($collection)
    {
        return $this->allowToOnce(static::ACTION_READ, $collection);
    }

    /**
     * Checks whether the user can read their own items in the given collection
     *
     * @param $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canReadMine($collection, $status = null)
    {
        return $this->canReadAt(static::LEVEL_MINE, $collection, $status);
    }

    /**
     * Checks whether the user can read items owned by a user in the same user role in the given collection
     *
     * @param $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canReadFromRole($collection, $status = null)
    {
        return $this->canReadAt(static::LEVEL_ROLE, $collection, $status);
    }

    /**
     * Checks whether the user can read any items in the given collection
     *
     * @param $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canReadAll($collection, $status = null)
    {
        return $this->canReadAt(static::LEVEL_FULL, $collection, $status);
    }

    /**
     * Checks whether the user can update an item in the given collection
     *
     * @param int $level
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canUpdateAt($level, $collection, $status = null)
    {
        return $this->allowTo(static::ACTION_UPDATE, $level, $collection, $status);
    }

    /**
     * Checks whether the user can update at least their own items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canUpdate($collection, $status = null)
    {
        return $this->canUpdateMine($collection, $status);
    }

    /**
     * Checks whether the user can update their own items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canUpdateMine($collection, $status = null)
    {
        return $this->canUpdateAt(static::LEVEL_MINE, $collection, $status);
    }

    /**
     * Checks whether the user can update items owned by a user of the same user role in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canUpdateFromRole($collection, $status = null)
    {
        return $this->canUpdateAt(static::LEVEL_ROLE, $collection, $status);
    }

    /**
     * Checks whether the user can update all items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canUpdateAll($collection, $status = null)
    {
        return $this->canUpdateAt(static::LEVEL_FULL, $collection, $status);
    }

    /**
     * Checks whether the user can delete an item in the given collection
     *
     * @param int $level
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canDeleteAt($level, $collection, $status = null)
    {
        return $this->allowTo(static::ACTION_DELETE, $level, $collection, $status);
    }

    /**
     * Checks whether the user can delete at least their own items in the given collection
     *
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canDelete($collection, $status = null)
    {
        return $this->canDeleteMine($collection, $status);
    }

    /**
     * Checks whether the user can delete its own items in the given collection
     *
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canDeleteMine($collection, $status = null)
    {
        return $this->canDeleteAt(static::LEVEL_MINE, $collection, $status);
    }

    /**
     * Checks whether the user can delete items that belongs to an user in the same role in the given collection
     *
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canDeleteFromRole($collection, $status = null)
    {
        return $this->canDeleteAt(static::LEVEL_ROLE, $collection, $status);
    }

    /**
     * Checks whether the user can delete any items in the given collection
     *
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function canDeleteAll($collection, $status = null)
    {
        return $this->canDeleteAt(static::LEVEL_FULL, $collection, $status);
    }

    /**
     * Checks whether the user can alter the given table
     *
     * @param $collection
     *
     * @return bool
     */
    public function canAlter($collection)
    {
        return $this->isAdmin();
    }

    /**
     * Checks whether or not the user has permission to create comments
     *
     * @param string $collection
     * @param null $status
     *
     * @return bool
     */
    public function canCreateComments($collection, $status = null)
    {
        return $this->canComment(static::COMMENT_LEVEL_CREATE, $collection, $status);
    }

    /**
     * Throws exception when user cannot create comments
     *
     * @param string $collection
     * @param null $status
     *
     * @throws ForbiddenCommentCreateException
     */
    public function enforceCreateComments($collection, $status = null)
    {
        if (!$this->canCreateComments($collection, $status)) {
            throw new ForbiddenCommentCreateException($collection);
        }
    }

    /**
     * Checks whether or not the user has permission to update their comments
     *
     * @param string $collection
     * @param null $status
     *
     * @return bool
     */
    public function canUpdateMyComments($collection, $status = null)
    {
        return $this->canComment(static::COMMENT_LEVEL_UPDATE, $collection, $status);
    }

    /**
     * Throws exception when user cannot update their comments
     *
     * @param string $collection
     * @param null $status
     *
     * @throws ForbiddenCommentUpdateException
     */
    public function enforceUpdateMyComments($collection, $status = null)
    {
        if (!$this->canUpdateMyComments($collection, $status)) {
            throw new ForbiddenCommentUpdateException($collection);
        }
    }

    /**
     * Checks whether or not the user can update any comments
     *
     * @param string $collection
     * @param null $status
     *
     * @return bool
     */
    public function canUpdateAnyComments($collection, $status = null)
    {
        return $this->canComment(static::COMMENT_LEVEL_FULL, $collection, $status);
    }

    /**
     * Throws exception when user cannot update any comments
     *
     * @param string $collection
     * @param null $status
     *
     * @throws ForbiddenCommentUpdateException
     */
    public function enforceUpdateAnyComments($collection, $status = null)
    {
        if (!$this->canUpdateAnyComments($collection, $status)) {
            throw new ForbiddenCommentUpdateException($collection);
        }
    }

    /**
     * Checks whether or not the user can delete their comments
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canDeleteMyComments($collection, $status = null)
    {
        return $this->canUpdateMyComments($collection, $status);
    }

    /**
     * Throws exception when user cannot delete their comments
     *
     * @param string $collection
     * @param null $status
     *
     * @throws ForbiddenCommentDeleteException
     */
    public function enforceDeleteMyComments($collection, $status = null)
    {
        if (!$this->canDeleteMyComments($collection, $status)) {
            throw new ForbiddenCommentDeleteException($collection);
        }
    }

    /**
     * Checks whether or not the user can delete any comments
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return bool
     */
    public function canDeleteAnyComments($collection, $status = null)
    {
        return $this->canComment(static::COMMENT_LEVEL_FULL, $collection, $status);
    }

    /**
     * Throws exception when user cannot delete any comments
     *
     * @param string $collection
     * @param null $status
     *
     * @throws ForbiddenCommentDeleteException
     */
    public function enforceDeleteAnyComments($collection, $status = null)
    {
        if (!$this->canDeleteAnyComments($collection, $status)) {
            throw new ForbiddenCommentDeleteException($collection);
        }
    }

    /**
     * Checks whether a given collection requires explanation message
     *
     * @param string $collection
     * @param string|int|null $status
     *
     * @return bool
     */
    public function requireExplanation($collection, $status = null)
    {
        return $this->requireExplanationAt(static::EXPLAIN_LEVEL_ALWAYS, $collection, $status);
    }

    public function requireExplanationAt($action, $collection, $status = null)
    {
        $permission = $this->getPermission($collection, $status);
        if (!array_key_exists('explain', $permission)) {
            return false;
        }

        return $permission['explain'] === $action;
    }

    /**
     * Throws an exception if the user cannot read their own items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionReadException
     */
    public function enforceReadMine($collection, $status = null)
    {
        if (!$this->canReadMine($collection, $status)) {
            throw new Exception\ForbiddenCollectionReadException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot read items that belongs to an user in the same role in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionReadException
     */
    public function enforceReadFromRole($collection, $status = null)
    {
        if (!$this->canReadFromRole($collection, $status)) {
            throw new Exception\ForbiddenCollectionReadException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot read all items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionReadException
     */
    public function enforceReadAll($collection, $status = null)
    {
        if (!$this->canReadAll($collection, $status)) {
            throw new Exception\ForbiddenCollectionReadException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot create a item in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionReadException
     */
    public function enforceRead($collection, $status = null)
    {
        $this->enforceReadMine($collection, $status);
    }

    /**
     * Throws an exception if the user cannot read a item in any level or status
     *
     * @param string $collection
     *
     * @throws Exception\ForbiddenCollectionReadException
     */
    public function enforceReadOnce($collection)
    { 
        if (!$this->canReadOnce($collection)) {
            // If a collection can't be accessed by the public group and user not logged in, ACL will return the unauthorized exception otherwise it will return forbidden error.
            if($this->isPublic()){
                throw new UnauthorizedException('Unauthorized request');
            }else{
                throw new Exception\ForbiddenCollectionReadException(
                    $collection
                );
            }
        }
    }

    /**
     * Throws an exception if the user cannot create a item in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionCreateException
     */
    public function enforceCreate($collection, $status = null)
    {
        if (!$this->canCreate($collection, $status)) {
            throw new Exception\ForbiddenCollectionCreateException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot alter the given collection
     *
     * @param $collection
     *
     * @throws Exception\ForbiddenCollectionAlterException
     */
    public function enforceAlter($collection)
    {
        if (!$this->canAlter($collection)) {
            throw new Exception\ForbiddenCollectionAlterException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot update their own items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionUpdateException
     */
    public function enforceUpdateMine($collection, $status = null)
    {
        if (!$this->canUpdateMine($collection, $status)) {
            throw new Exception\ForbiddenCollectionUpdateException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot update items that longs to an user in the same role in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionUpdateException
     */
    public function enforceUpdateFromRole($collection, $status = null)
    {
        if (!$this->canUpdateFromRole($collection, $status)) {
            throw new Exception\ForbiddenCollectionUpdateException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot update all items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionUpdateException
     */
    public function enforceUpdateAll($collection, $status = null)
    {
        if (!$this->canUpdateAll($collection, $status)) {
            throw new Exception\ForbiddenCollectionUpdateException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot update an item in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionUpdateException
     */
    public function enforceUpdate($collection, $status = null)
    {
        $this->enforceUpdateMine($collection, $status);
    }

    /**
     * Throws an exception if the user cannot delete their own items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionDeleteException
     */
    public function enforceDeleteMine($collection, $status = null)
    {
        if (!$this->canDeleteMine($collection, $status)) {
            throw new Exception\ForbiddenCollectionDeleteException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot delete items that belongs to an user in the same role in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionDeleteException
     */
    public function enforceDeleteFromRole($collection, $status = null)
    {
        if (!$this->canDeleteFromRole($collection, $status)) {
            throw new Exception\ForbiddenCollectionDeleteException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot delete all items in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionDeleteException
     */
    public function enforceDeleteAll($collection, $status = null)
    {
        if (!$this->canDeleteAll($collection, $status)) {
            throw new Exception\ForbiddenCollectionDeleteException(
                $collection
            );
        }
    }

    /**
     * Throws an exception if the user cannot delete an item in the given collection
     *
     * @param string $collection
     * @param mixed $status
     *
     * @throws Exception\ForbiddenCollectionDeleteException
     */
    public function enforceDelete($collection, $status = null)
    {
        $this->enforceDeleteMine($collection, $status);
    }

    /**
     * Checks whether the user can see the given column
     *
     * @param string $collection
     * @param string $field
     * @param null|string|int $status
     *
     * @return bool
     */
    public function canReadField($collection, $field, $status = null)
    {
        $fields = $this->getReadFieldBlacklist($collection, $status);

        return !in_array($field, $fields);
    }

    /**
     * Checks whether the user can see the given column
     *
     * @param string $collection
     * @param string $field
     * @param null|int|string $status
     *
     * @return bool
     */
    public function canWriteField($collection, $field, $status = null)
    {
        $fields = $this->getWriteFieldBlacklist($collection, $status);

        return !in_array($field, $fields);
    }

    /**
     * Throws an exception if the user has not permission to read from the given field
     *
     * @param string $collection
     * @param string|array $fields
     * @param null|int|string $status
     *
     * @throws ForbiddenFieldReadException
     */
    public function enforceReadField($collection, $fields, $status = null)
    {
        if (!is_array($fields)) {
            $fields = [$fields];
        }

        foreach ($fields as $field) {
            if (!$this->canReadField($collection, $field, $status)) {
                throw new ForbiddenFieldReadException($collection, $field);
            }
        }
    }

    /**
     * Throws an exception if the user has not permission to write to the given field
     *
     * @param string $collection
     * @param string|array $fields
     * @param null|int|string $status
     *
     * @throws ForbiddenFieldWriteException
     */
    public function enforceWriteField($collection, $fields, $status = null)
    {
        if (!is_array($fields)) {
            $fields = [$fields];
        }

        foreach ($fields as $field) {
            if (!$this->canWriteField($collection, $field, $status)) {
                throw new ForbiddenFieldWriteException($collection, $field);
            }
        }
    }

    /**
     * Given table name $table and privilege constant $privilege, return boolean
     * value indicating whether the current user group has permission to perform
     * the specified table-level action on the specified table.
     *
     * @param string $action
     * @param string $collection
     * @param int $level
     * @param mixed $status
     *
     * @return boolean
     */
   public function allowTo($action, $level, $collection, $status = null)
    {
        if ($this->isAdmin()) {
            return true;
        }

        $permission = $this->getPermission($collection, $status);

        if (count($permission) === 0) {
            $statuses = $this->getCollectionStatuses($collection);

            $allowed = false;
            if($statuses){
                foreach ($statuses as $status) {
                    $permission = $this->getPermission($collection, $status);
                    $permissionLevel = ArrayUtils::get($permission, $action);
                    if ($this->can($permissionLevel, $level)) {
                        $allowed = true;
                        break;
                    }
                }
            }
            return $allowed;
        } else {
            $permissionLevel = ArrayUtils::get($permission, $action);
            return $this->can($permissionLevel, $level);
        }
    }

    public function allowToOnce($action, $collection)
    {
        if ($this->isAdmin()) {
            return true;
        }

        $permissions = [];
        if (array_key_exists($collection, $this->statusPermissions)) {
            $permissions = $this->statusPermissions[$collection];
        } else if (array_key_exists($collection, $this->globalPermissions)) {
            $permissions = [$this->globalPermissions[$collection]];
        }

        $allowed = false;
        foreach ($permissions as $permission) {
            $permissionLevel = ArrayUtils::get($permission, $action);

            if ($this->can($permissionLevel, static::LEVEL_MINE)) {
                $allowed = true;
                break;
            }
        }

        return $allowed;
    }
    
    /**
     * Gets the statuses on which field has been blacklisted
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return array
     */
    public function getStatusesOnReadFieldBlacklist($collection, $field)
    {
        $blackListStatuses = [];
        $collectionPermission = $this->getCollectionPermissions($collection);
        $statuses = $this->getCollectionStatuses($collection);
        if($statuses){
            foreach($statuses as $status){
                $readFieldBlackList = isset($collectionPermission[$status]['read_field_blacklist']) ? $collectionPermission[$status]['read_field_blacklist'] : [];
                if($readFieldBlackList && in_array($field, $readFieldBlackList)){                    
                    $blackListStatuses['statuses'][] = $status;
                }
            }
            //Set flag for field which is blacklist for all statuses
            if(isset($blackListStatuses['statuses']) && count($blackListStatuses['statuses']) == count($statuses)){
                $blackListStatuses['isReadBlackList'] = true;
            }
        }else{
            $readFieldBlackList = isset($collectionPermission['read_field_blacklist']) ? $collectionPermission['read_field_blacklist'] : [];
            if($readFieldBlackList && in_array($field, $readFieldBlackList)){
                $blackListStatuses['isReadBlackList'] = true;
            }
        }
        return $blackListStatuses;
    }
    
    /**
     * Gets the statuses on which field has been write blacklisted
     *
     * @param string $collection
     * @param mixed $status
     *
     * @return array
     */
    public function getStatusesOnWriteFieldBlacklist($collection, $field)
    {
        $blackListStatuses = [];
        $collectionPermission = $this->getCollectionPermissions($collection);
        $statuses = $this->getCollectionStatuses($collection);
        if($statuses){
            foreach($statuses as $status){
                $writeFieldBlackList = isset($collectionPermission[$status]['write_field_blacklist']) ? $collectionPermission[$status]['write_field_blacklist'] : [];
                if($writeFieldBlackList && in_array($field, $writeFieldBlackList)){                    
                    $blackListStatuses['statuses'][] = $status;
                }
            }
            //Set flag for field which is blacklist for all statuses
            if(isset($blackListStatuses['statuses']) && count($blackListStatuses['statuses']) == count($statuses)){
                $blackListStatuses['isWriteBlackList'] = true;
            }
        }else{
            $writeFieldBlackList = isset($collectionPermission['write_field_blacklist']) ? $collectionPermission['write_field_blacklist'] : [];
            if($writeFieldBlackList && in_array($field, $writeFieldBlackList)){
                $blackListStatuses['isWriteBlackList'] = true;
            }
        }
        return $blackListStatuses;
    }
    
    /**
     * Returns a list of status the given collection has permission to read
     *
     * @param string $collection
     *
     * @return array|mixed
     */
    public function getCollectionStatusesReadPermission($collection)
    {
        if ($this->isAdmin()) {
            return null;
        }

        $statuses = false;

        if (array_key_exists($collection, $this->statusPermissions)) {
            $statuses = [];

            foreach ($this->statusPermissions[$collection] as $status => $permission) {
                $permissionLevel = ArrayUtils::get($permission, static::ACTION_READ);

                if ($this->can($permissionLevel, static::LEVEL_MINE)) {
                    $statuses[] = $status;
                }
            }
        } else if (array_key_exists($collection, $this->globalPermissions)) {
            $permission = $this->globalPermissions[$collection];
            $permissionLevel = ArrayUtils::get($permission, static::ACTION_READ);

            if ($this->can($permissionLevel, static::LEVEL_MINE)) {
                $statuses = null;
            }
        }

        return $statuses;
    }

    /**
     * Checks whether or not a permission level has equal or higher level
     *
     * @param string $permissionLevel
     * @param string $level
     *
     * @return bool
     */
    protected function can($permissionLevel, $level)
    {
        if (!$permissionLevel) {
            return false;
        }

        $levelValue = ArrayUtils::get($this->permissionLevelsMapping, $level);
        $permissionLevelValue = ArrayUtils::get($this->permissionLevelsMapping, $permissionLevel);

        if ($levelValue && $permissionLevelValue) {
            return $levelValue <= $permissionLevelValue;
        }

        return false;
    }

    /**
     * Check whether the user has permission to a permission level in the given collection
     *
     * @param string $level
     * @param string $collection
     * @param null $status
     *
     * @return bool
     */
    protected function canComment($level, $collection, $status = null)
    {
        $permission = $this->getPermission($collection, $status);
        if (!array_key_exists('comment', $permission) || $permission['comment'] === null) {
            return true;
        }

        $permissionLevel = ArrayUtils::get($this->commentLevelsMapping, $permission['comment']);
        $targetLevel = ArrayUtils::get($this->commentLevelsMapping, $level);

        if (!$permissionLevel || !$targetLevel) {
            return false;
        }

        return $permissionLevel >= $targetLevel;
    }
}
