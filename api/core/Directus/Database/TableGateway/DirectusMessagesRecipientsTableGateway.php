<?php

namespace Directus\Database\TableGateway;

use Directus\Util\ArrayUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusMessagesRecipientsTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_messages_recipients';

    public $primaryKeyFieldName = 'id';

    public function __construct(AdapterInterface $adapter, $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function fetchMessageRecipients($messageIds = [])
    {
        $select = new Select($this->getTable());
        $select
            ->columns(['id', 'message_id', 'recipient', 'read'])
            ->where->in('message_id', $messageIds);

        $records = $this->selectWith($select)->toArray();
        $recipientMap = [];

        foreach ($records as $record) {
            $messageId = $record['message_id'];
            $recipient = $record['recipient'];
            $read = (bool) $record['read'];

            if (!array_key_exists($messageId, $recipientMap)) {
                $recipientMap[$messageId] = [];
            }

            $recipientMap[$messageId]['recipients'][] = $recipient;
            if ($read) {
                $recipientMap[$messageId]['reads'][] = $recipient;
            }
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
                ->columns([
                    'recipient',
                    'read' => new Expression('SUM(IF(`read`=1,1,0))'),
                    'total' => new Expression('COUNT(`id`)'),
                    'max_id' => new Expression('MAX(`message_id`)')
                ])
                ->where->equalTo('recipient', $uid);

            $select->group(['recipient']);

            $result = $this->selectWith($select)->current();
            $result = $result ? $result->toArray() : [];

            // convert all elements into integer
            foreach ($result as $key => $value) {
                $result[$key] = (int) $value;
            }

            return $result;
        };

        $result = $fetchFn();

        if ($result) {
            $result['unread'] = $result['total'] - $result['read'];
        }

        return $result;
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

    public function archiveMessages($userId, $messagesIds)
    {
        $payload = ['archived' => 1];

        $select = new Select('directus_messages');
        $select
            ->columns(['id'])
            ->where
                ->in('id', $messagesIds)
                ->or
                ->in('response_to', $messagesIds);

        $result = $this->selectWith($select);

        if (!$result) {
            return false;
        }

        $result = $result->toArray();

        $responsesIds = [];
        foreach ($result as $item) {
            array_push($responsesIds, ArrayUtils::get($item, 'id'));
        }

        $update = new Update($this->getTable());
        $update->set($payload);
        $update
            ->where
            ->equalTo('recipient', $userId)
            ->in('message_id', $responsesIds);

        return $this->updateWith($update);
    }
}
