<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Directus\MemcacheProvider;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusMessagesRecipientsTableGateway extends BaseTableGateway
{
    public static $_tableName = 'directus_messages_recipients';

    public function __construct(AdapterInterface $adapter, $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function fetchMessageRecipients($messageIds = [])
    {
        $select = new Select($this->getTable());
        $select
            ->columns(['id', 'message_id', 'recipient'])
            ->where->in('message_id', $messageIds);

        $records = $this->selectWith($select)->toArray();
        $recipientMap = [];

        foreach ($records as $record) {
            $messageId = $record['message_id'];
            if (!array_key_exists($messageId, $recipientMap)) {
                $recipientMap[$messageId] = [];
            }
            $recipientMap[$messageId][] = $record['recipient'];
        }

        return $recipientMap;
    }

    public function markAsRead($messageIds, $uid)
    {
        $update = new Update($this->getTable());
        $update
            ->set(['read' => 1])
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
                ->columns(['id', 'read', 'count' => new Expression('COUNT(`id`)'), 'max_id' => new Expression('MAX(`message_id`)')])
                ->where->equalTo('recipient', $uid);
            $select
                ->group(['id', 'read']);
            $result = $this->selectWith($select)->toArray();
            return $result;
        };
        //$cacheKey = MemcacheProvider::getKeyDirectusCountMessages($uid);
        //$result = $this->memcache->getOrCache($cacheKey, $fetchFn, 1800);
        $result = $fetchFn();

        $count = [
            'read' => 0,
            'unread' => 0,
            'total' => 0,
            'max_id' => 0
        ];

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
                ->columns(['id', 'message_id'])
                ->join('directus_messages', 'directus_messages_recipients.message_id = directus_messages.id', ['response_to'])
                ->where
                ->greaterThan('message_id', $maxId)
                ->and
                ->equalTo('recipient', $currentUser)
                ->and
                ->equalTo('read', 0);
            $result = $this->selectWith($select)->toArray();
            return $result;
        };
        // $cacheKey = MemcacheProvider::getKeyDirectusMessagesNewerThan($maxId, $currentUser);
        // $result = $this->memcache->getOrCache($cacheKey, $fetchFn, 1800);
        $result = $fetchFn();

        $messageThreads = [];

        foreach ($result as $message) {
            $messageThreads[] = empty($message['response_to']) ? $message['message_id'] : $message['response_to'];
        }

        return array_values(array_unique($messageThreads));
    }

}
