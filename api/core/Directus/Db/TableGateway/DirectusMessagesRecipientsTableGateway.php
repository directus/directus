<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\MemcacheProvider;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusMessagesRecipientsTableGateway extends AclAwareTableGateway
{

    public static $_tableName = "directus_messages_recipients";

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function fetchMessageRecipients($messageIds = array())
    {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id', 'message_id', 'recipient'))
            ->where->in('message_id', $messageIds);

        $records = $this->selectWith($select)->toArray();
        $recipientMap = array();

        foreach ($records as $record) {
            $messageId = $record['message_id'];
            if (!array_key_exists($messageId, $recipientMap)) {
                $recipientMap[$messageId] = array();
            }
            $recipientMap[$messageId][] = $record['recipient'];
        }

        return $recipientMap;
    }

    public function markAsRead($messageIds, $uid)
    {
        $update = new Update($this->getTable());
        $update
            ->set(array('read' => 1))
            ->where->in('message_id', $messageIds)
            ->and
            ->where->equalTo('recipient', $uid);

        return $this->updateWith($update);
    }

    public function countMessages($uid)
    {
        $fetchFn = function () use ($uid) {
            $select = new Select($this->table);
            $select
                ->columns(array('id', 'read', 'count' => new Expression('COUNT(`id`)'), 'max_id' => new Expression('MAX(`message_id`)')))
                ->where->equalTo('recipient', $uid);
            $select
                ->group(array('id', 'read'));
            $result = $this->selectWith($select)->toArray();
            return $result;
        };
        $cacheKey = MemcacheProvider::getKeyDirectusCountMessages($uid);
        $result = $this->memcache->getOrCache($cacheKey, $fetchFn, 1800);

        $count = array(
            'read' => 0,
            'unread' => 0,
            'total' => 0,
            'max_id' => 0
        );

        foreach ($result as $item) {
            if ((int)$item['max_id'] > $count['max_id']) {
                $count['max_id'] = (int)$item['max_id'];
            }
            switch ($item['read']) {
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

    public function getMessagesNewerThan($maxId, $currentUser)
    {
        $fetchFn = function () use ($maxId, $currentUser) {
            $select = new Select($this->getTable());
            $select
                ->columns(array('id', 'message_id'))
                ->join('directus_messages', 'directus_messages_recipients.message_id = directus_messages.id', array('response_to'))
                ->where
                ->greaterThan('message_id', $maxId)
                ->and
                ->equalTo('recipient', $currentUser)
                ->and
                ->equalTo('read', 0);
            $result = $this->selectWith($select)->toArray();
            return $result;
        };
        $cacheKey = MemcacheProvider::getKeyDirectusMessagesNewerThan($maxId, $currentUser);
        $result = $this->memcache->getOrCache($cacheKey, $fetchFn, 1800);

        $messageThreads = array();

        foreach ($result as $message) {
            $messageThreads[] = empty($message['response_to']) ? $message['message_id'] : $message['response_to'];
        }

        return array_values(array_unique($messageThreads));
    }

}
