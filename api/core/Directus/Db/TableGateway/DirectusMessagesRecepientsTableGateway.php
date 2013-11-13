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
            ->set(array('read' => 1))
            ->where->in('message_id', $messageIds)
            ->and
            ->where->equalTo('recepient', $uid);

        return $this->updateWith($update);
    }

    public function countMessages($uid) {
        $select = new Select($this->table);
        $select
            ->columns(array('id','read','count' => new Expression('COUNT(`id`)'),'max_id' => new Expression('MAX(`message_id`)')))
            ->where->equalTo('recepient', $uid);
        $select
            ->group('read');

        $result = $this->selectWith($select)->toArray();

        $count = array(
            'read'=> 0,
            'unread' => 0,
            'total' => 0,
            'max_id' => 0
        );

        foreach($result as $item) {
            if ((int)$item['max_id'] > $count['max_id']) {
                $count['max_id'] = (int)$item['max_id'];
            }
            switch($item['read']) {
                case '1':
                    $count['read'] = (int)$item['count'];
                    break;
                case '0':
                    $count['unread'] = (int)$item['count'];
                    break;
            }
        }

        $count['total'] = $count['read'] + $count['unread'];

        return $count;
    }

    public function getMessagesNewerThan($maxId, $currentUser) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id','message_id'))
            ->join('directus_messages', 'directus_messages_recepients.message_id = directus_messages.id',array('response_to'))
            ->where
                ->greaterThan('message_id', $maxId)
                ->and
                ->equalTo('recepient', $currentUser)
                ->and
                ->equalTo('read', 0);

        $result = $this->selectWith($select)->toArray();

        $messageThreads = array();

        foreach ($result as $message) {
            $messageThreads[] = $message['response_to'];
        }

        return array_values(array_unique($messageThreads));
    }

}