<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Expression;
use Zend\Db\Adapter\Adapter;

class DirectusMessagesRecepientsTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_messages_recepients";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function fetchMessageRecepients($messageIds = array()) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id','message_id','recepient'))
            ->where->in('message_id', $messageIds);

        $records = $this->selectWith($select)->toArray();
        $recepientMap = array();

        foreach ($records as $record) {
            $messageId = $record['message_id'];
            if (!array_key_exists($messageId, $recepientMap)) {
                $recepientMap[$messageId] = array();
            }
            $recepientMap[$messageId][] = $record['recepient'];
        }

        return $recepientMap;
    }

    public function markAsRead($messageIds, $uid) {
        $update = new Update($this->getTable());
        $update
            ->set(array('read'=>1))
            ->where->in('message_id', $messageIds)
            ->and
            ->where->equalTo('recepient', $uid);

        return $this->updateWith($update);
    }

}