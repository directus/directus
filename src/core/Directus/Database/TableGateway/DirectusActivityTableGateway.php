<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Directus\Util\DateTimeUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;

class DirectusActivityTableGateway extends RelationalTableGateway
{
    // Populates directus_activity.action
    const ACTION_CREATE = 'create';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';
    const ACTION_SOFT_DELETE = 'soft-delete';
    const ACTION_REVERT = 'revert';
    const ACTION_COMMENT = 'comment';
    const ACTION_UPLOAD = 'upload';
    const ACTION_AUTHENTICATE = 'authenticate';

    public static $_tableName = 'directus_activity';

    public $primaryKeyFieldName = 'id';

    public static function makeLogActionFromTableName($table, $action)
    {
        $action = strtolower($action);

        switch ($table) {
            case 'directus_files':
                $action = $action === self::ACTION_CREATE ? self::ACTION_UPLOAD : $action;
                break;
        }

        return $action;
    }

    /**
     * DirectusActivityTableGateway constructor.
     *
     * @param AdapterInterface $adapter
     * @param Acl $acl
     */
    public function __construct(AdapterInterface $adapter, $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function recordLogin($userId)
    {
        $logData = [
            'collection' => 'directus_users',
            'action' => self::ACTION_AUTHENTICATE,
            'action_by' => $userId,
            'item' => $userId,
            'action_on' => DateTimeUtils::now()->toString(),
            'ip' => \Directus\get_request_ip(),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
        ];

        $insert = new Insert($this->getTable());
        $insert
            ->values($logData);

        $this->insertWith($insert);
    }
}
