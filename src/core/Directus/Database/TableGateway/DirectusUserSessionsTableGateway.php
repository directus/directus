<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Directus\Util\DateTimeUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Select;

class DirectusUserSessionsTableGateway extends RelationalTableGateway
{
    const TOKEN_COOKIE = 'cookie';
    const TOKEN_JWT = 'jwt';

    public static $_tableName = 'directus_user_sessions';

    public $primaryKeyFieldName = 'id';

    /**
     * DirectusUserSessionTableGateway constructor.
     *
     * @param AdapterInterface $adapter
     * @param Acl $acl
     */
    public function __construct(AdapterInterface $adapter, $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function recordSession($data)
    {
        $sessionData = [
            'user' => $data['user'],
            'token' => $data['token'],
            'token_type' => $data['token_type'],
            'token_expired_at' => $data['token_expired_at'],
            'created_on' => DateTimeUtils::now()->toString(),
            'ip_address' => \Directus\get_request_ip(),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
        ];
        
        $insert = new Insert($this->getTable());
        $insert
            ->values($sessionData);

        $this->insertWith($insert);
        return $this->getLastInsertValue();
    }

    public function updateSession($id,$data)
    {
        $update = new Update($this->getTable());
        $update->set($data);
        $update->where([
            'id' => $id
        ]);
        $this->updateWith($update);
    }

    public function fetchSession($condition)
    {
        $select = new Select($this->getTable());
        $select->columns(['*']);
        $select->where($condition);
        $select->limit(1);
        return $this->selectWith($select)->current();
    }

}
