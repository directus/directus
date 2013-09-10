<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Insert;
use Zend\Db\Adapter\Adapter;

class DirectusMessagesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_messages";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function sendMessage($payload, $recepients) {
        $insert = new Insert($this->getTable());
        $insert
            ->columns(array('from', 'subject', 'message'))
            ->values(array(
                'from' => 1,
                'subject' => '',
                'message' => 'a',
                ));
        $rows = $this->insertWith($insert);

        // Insert recepients
        $messageId = $this->lastInsertValue;
        $values = array();

        foreach($recepients as $recepient) {
            $values[] = "($recepient,$messageId,0)";
        }

        $valuesString = implode(',', $values);

        //@todo sanitize and implement ACL
        $sql = "INSERT INTO directus_messages_recepients (`directus_users_id`, `directus_messages_id`, `read`) VALUES $valuesString";
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        return $messageId;

    }

    public function fetchMessage($id) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('from', 'subject', 'message'))
            ->where
                ->equalTo('id', $id);
    }
}