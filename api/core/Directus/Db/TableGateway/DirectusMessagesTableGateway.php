<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Expression;
use Zend\Db\Adapter\Adapter;
use Directus\Db\TableGateway\DirectusMessagesRecepientsTableGateway;

class DirectusMessagesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_messages";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function sendMessage($payload, $recepients, $from) {
        $defaultValues = array(
            'response_to' => null
        );

        $payload = array_merge($defaultValues, $payload);

        $insert = new Insert($this->getTable());
        $insert
            ->columns(array('from', 'subject', 'message'))
            ->values(array(
                'from' => $from,
                'subject' => $payload['subject'],
                'message' => $payload['message'],
                'datetime' => new Expression('NOW()'),
                'response_to' => $payload['response_to']
                ));
        $rows = $this->insertWith($insert);

        $messageId = $this->lastInsertValue;

        // Insert recepients
        $values = array();
        foreach($recepients as $recepient) {
            $read = 0;
            if ((int)$recepient == (int)$from) {
                $read = 1;
            }
            $values[] = "($messageId, $recepient, $read)";
        }

        $valuesString = implode(',', $values);

        //@todo sanitize and implement ACL
        $sql = "INSERT INTO directus_messages_recepients (`message_id`, `recepient`, `read`) VALUES $valuesString";
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        return $messageId;
    }

    public function fetchMessageThreads($ids, $uid) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id', 'from', 'subject', 'message', 'attachment', 'datetime', 'response_to'))
            ->join('directus_messages_recepients', 'directus_messages.id = directus_messages_recepients.message_id', array('read'))
            ->where
                ->equalTo('directus_messages_recepients.recepient', $uid)
            ->and
            ->where
                ->nest
                  ->in('directus_messages.response_to', $ids)
                  ->or
                  ->in('directus_messages.id', $ids)
                ->unnest;

        $result = $this->selectWith($select)->toArray();

        foreach($result as &$message) {
            $message['id'] = (int)$message['id'];
        }

        return $result;
    }

    public function fetchMessageWithRecepients($id, $uid) {
        $result = $this->fetchMessagesInbox($uid, $id);
        if (sizeof($result) > 0) {
            return $result[0];
        }
    }

    public function fetchMessagesInbox($uid, $messageId = null) {
        $select = new Select($this->table);
        $select
            ->columns(array('message_id' => 'response_to', 'thread_length' => new Expression('COUNT(`directus_messages`.`id`)')))
            ->join('directus_messages_recepients', 'directus_messages_recepients.message_id = directus_messages.id');
        $select
            ->where->equalTo('recepient', $uid);

        if (!empty($messageId)) {
            if (gettype($messageId) ==  'array') {
                $select->where
                       ->in('response_to', $messageId)
                       ->or
                       ->in('directus_messages.id', $messageId);
            } else {
                $select->where
                       ->nest
                         ->equalTo('response_to', $messageId)
                         ->or
                         ->equalTo('directus_messages.id', $messageId)
                       ->unnest;
            }
        }

        $select
            ->group(new Expression('IFNULL(response_to, directus_messages.id)'))
            ->order('directus_messages.id DESC');

        $result = $this->selectWith($select)->toArray();
        $messageIds = array();

        foreach ($result as $message) {
            $messageIds[] = $message['message_id'];
        }

        if (sizeof($messageIds) == 0) {
            return array();
        };

        $result = $this->fetchMessageThreads($messageIds, $uid);

        if (sizeof($result) == 0) return array();

        $resultLookup = array();
        $ids = array();

        // Grab ids;
        foreach ($result as $item) { $ids[] = $item['id']; }

        $directusMessagesTableGateway = new DirectusMessagesRecepientsTableGateway($this->acl, $this->adapter);
        $recepients = $directusMessagesTableGateway->fetchMessageRecepients($ids);

        foreach ($result as $item) {
            $item['responses'] = array('rows'=>array());
            $item['recepients'] = implode(',', $recepients[$item['id']]);
            $resultLookup[$item['id']] = $item;
        }

        foreach ($result as $item) {
            if ($item['response_to'] != NULL) {
                // Move it to resultLookup
                unset($resultLookup[$item['id']]);
                $resultLookup[$item['response_to']]['responses']['rows'][] = $item;
            }
        }

        $result = array_values($resultLookup);

        // Add date_updated
        // Update read
        foreach ($result as &$message) {
            $responses = $message['responses']['rows'];
            foreach ($responses as $response) {
                if($response['read'] == "0") {
                    $message['read'] = "0";
                    break;
                }
            }
            $lastResponse = (end($responses));
            if ($lastResponse) {
                $message['date_updated'] = $lastResponse['datetime'];
            } else {
                $message['date_updated'] = $message['datetime'];
            }
        }

        return $result;
    }

    public function fetchMessagesInboxWithHeaders($uid, $messageIds=null) {
        $messagesRecepientsTableGateway = new DirectusMessagesRecepientsTableGateway($this->acl, $this->adapter);
        $result = $messagesRecepientsTableGateway->countMessages($uid);
        $result['rows'] = $this->fetchMessagesInbox($uid, $messageIds);
        return $result;

    }
}