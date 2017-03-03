<?php

namespace Directus\Database\TableGateway;

use Directus\Database\Query\Builder;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusMessagesTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_messages';

    public function __construct(AdapterInterface $adapter, Acl $acl)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function sendMessage($payload, $recipients, $from)
    {
        $defaultValues = [
            'response_to' => null
        ];

        $payload = array_merge($defaultValues, $payload);

        $insert = new Insert($this->getTable());
        $insert
            ->columns(['from', 'subject', 'message'])
            ->values([
                'from' => $from,
                'subject' => $payload['subject'],
                'message' => $payload['message'],
                'datetime' => DateUtils::now(),
                'attachment' => ArrayUtils::get($payload, 'attachment'),
                'response_to' => $payload['response_to']
            ]);
        $rows = $this->insertWith($insert);

        $messageId = $this->lastInsertValue;

        // Insert recipients
        $values = [];
        foreach ($recipients as $recipient) {
            $read = 0;
            if ((int)$recipient == (int)$from) {
                $read = 1;
            }
            $values[] = '(' . $messageId . ', ' . $recipient . ', ' . $read . ')';
        }

        $valuesString = implode(',', $values);

        //@todo sanitize and implement ACL
        $sql = 'INSERT INTO directus_messages_recipients (`message_id`, `recipient`, `read`) VALUES ' . $valuesString;
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        return $messageId;
    }

    public function fetchMessageThreads($ids, $uid)
    {
        $select = new Select($this->getTable());
        $select
            ->columns(['id', 'from', 'subject', 'message', 'attachment', 'datetime', 'response_to'])
            ->join('directus_messages_recipients', 'directus_messages.id = directus_messages_recipients.message_id', ['read', 'archived'])
            ->where
            ->equalTo('directus_messages_recipients.recipient', $uid)
            ->and
            ->where
            ->nest
            ->in('directus_messages.response_to', $ids)
            ->or
            ->in('directus_messages.id', $ids)
            ->unnest;

        $result = $this->selectWith($select)->toArray();

        foreach ($result as &$message) {
            $message = $this->parseRecordValuesByType($message, 'directus_messages_recipients');
        }

        // Remove archived messages
        // TODO: Make this behavior done in the query
        foreach($result as $key => $item) {
            if ($item['archived'] === 1 && $item['response_to'] !== null) {
                unset($result[$key]);
            }
        }

        return $result;
    }

    public function fetchMessageWithRecipients($id, $uid)
    {
        $result = $this->fetchMessagesInbox($uid, $id);
        if (sizeof($result) > 0) {
            return $result[0];
        }
    }

    public function fetchMessagesInbox($uid, $messageId = null, $params = [])
    {
        $messageIds = [];
        $params['columns'] = ArrayUtils::get($params, 'columns', 'id');
        $table = $this;
        $result = $this->loadItems($params, function (Builder $query) use ($uid, $table, $messageId) {
            $query->join('directus_messages_recipients', 'directus_messages_recipients.message_id = directus_messages.id', [
                'recipient'
            ]);

            $query->whereEqualTo('directus_messages_recipients.recipient', $uid);
            $query->whereNotEqualTo('directus_messages_recipients.archived', 1);

            if ($messageId) {
                if (! is_array($messageId)) {
                    $messageId = [$messageId];
                }

                $query->whereIn('directus_messages.id', $messageId);
            }

            return $query;
        });

        foreach ($result as $message) {
            $messageIds[] = $message['id'];
        }

        if (count($messageIds) === 0) {
            return [];
        };

        $result = $this->fetchMessageThreads($messageIds, $uid);

        if (count($result) === 0) {
            return [];
        }

        $resultLookup = [];
        $ids = [];

        // Grab ids;
        foreach ($result as $item) {
            $ids[] = $item['id'];
        }

        $directusMessagesTableGateway = new DirectusMessagesRecipientsTableGateway($this->adapter, $this->acl);
        $recipients = $directusMessagesTableGateway->fetchMessageRecipients($ids);

        foreach ($result as $item) {
            $recipientsData = $recipients[$item['id']];
            $item['responses'] = ['data' => []];
            $item['recipients'] = implode(',', ArrayUtils::get($recipientsData, 'recipients', []));
            $item['reads'] = implode(',', ArrayUtils::get($recipientsData, 'reads', []));
            $resultLookup[$item['id']] = $item;
        }

        foreach ($result as $item) {
            if ($item['response_to'] != null) {
                // Move it to resultLookup
                unset($resultLookup[$item['id']]);
                $item = $this->parseRecord($item);
                $resultLookup[$item['response_to']]['responses']['data'][] = $item;
            }
        }

        $result = array_values($resultLookup);
        foreach ($result as $key => &$row) {
            // if (!$row['responses']['data']) {
            //   unset($result[$key]);
            //   continue;
            // }

            $row = $this->parseRecord($row);
            if (ArrayUtils::get($row, 'archived', 0) === 1) {
                $row = ArrayUtils::omit($row, ['message', 'attachment', 'reads']);
            }
        }

        // Add date_updated
        // Update read
        foreach ($result as &$message) {
            $responses = $message['responses']['data'];
            /*foreach ($responses as $response) {
                if($response['read'] == "0") {
                    $message['read'] = "0";
                    break;
                }
            }*/
            $lastResponse = (end($responses));
            if ($lastResponse) {
                $message['date_updated'] = $lastResponse['datetime'];
            } else {
                $message['date_updated'] = $message['datetime'];
            }
        }

        return $result;
    }

    public function fetchMessagesInboxWithHeaders($uid, $messageIds = null, $params = [])
    {
        $messagesRecipientsTableGateway = new DirectusMessagesRecipientsTableGateway($this->adapter, $this->acl);
        $result = $messagesRecipientsTableGateway->countMessages($uid);
        $result['data'] = $this->fetchMessagesInbox($uid, $messageIds, $params);

        return $result;
    }

    public function fetchComments($commentMetadata)
    {
        $select = new Select($this->table);
        $select
            ->where->equalTo('comment_metadata', $commentMetadata);

        $result = $this->selectWith($select)->toArray();

        return $result;
    }
}
