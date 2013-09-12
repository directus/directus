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

        // Insert recepients
        $messageId = $this->lastInsertValue;
        $values = array();

        foreach($recepients as $recepient) {
            $values[] = "($messageId,$recepient,0)";
        }

        $valuesString = implode(',', $values);

        //@todo sanitize and implement ACL
        $sql = "INSERT INTO directus_messages_recepients (`message_id`, `recepient`, `read`) VALUES $valuesString";
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        return $messageId;
    }

    private function fetchResponses($messageId, $uid) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id', 'from', 'subject', 'message', 'attachment', 'datetime'))
            ->join('directus_messages_recepients', 'directus_messages.id = directus_messages_recepients.message_id', array('read'))
            ->where
                ->equalTo('directus_messages_recepients.recepient', 7)
            ->and
            ->where
                ->equalTo('directus_messages.response_to', $messageId);

        $result = $this->selectWith($select)->toArray();

        // Do some typecasting
        foreach ($result as &$message) {
            $message['id'] = (int)$message['id'];
        }

        return $result;
    }

    public function fetchMessageWithRecepients($id, $uid) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id', 'from', 'subject', 'message', 'attachment','datetime'))
            ->join('directus_messages_recepients', 'directus_messages.id = directus_messages_recepients.message_id', array('read'))
            ->where
                ->equalTo('directus_messages.id', $id)
                ->and
                ->equalTo('directus_messages_recepients.recepient', $uid);

        $result = $this->selectWith($select)->toArray();

        $result = $result[0];

        $directusMessagesTableGateway = new DirectusMessagesRecepientsTableGateway($this->acl, $this->adapter);
        $recepients = $directusMessagesTableGateway->fetchMessageRecepients(array($id));

        $result['id'] = (int)$result['id'];
        $result['recepients'] = implode(',', $recepients[$id]);

        $responses = $this->fetchResponses($id, $uid);

        // Turn read to 0 if there are undread responses
        foreach ($responses as $response) {
            if($response['read'] == "0") {
                $result['read'] = "0";
                break;
            }
        }

        $lastResponse = (end($responses));

        if ($lastResponse) {
            $result['date_updated'] = $lastResponse['datetime'];
        } else {
            $result['date_updated'] = $result['datetime'];
        }

        $result['attachment'] = array();
        $result['responses'] = array('rows' => $responses);

        return $result;
    }

    public function fetchMessagesInbox($uid) {
        $select = new Select('directus_messages');
        $select
            ->join('directus_messages_recepients', 'directus_messages.id = directus_messages_recepients.message_id', array('read'))
            ->where
                ->equalTo('directus_messages_recepients.recepient', $uid);

        $result = $this->selectWith($select)->toArray();


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
            if ($item['response_to'] != null) {
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

    public function fetchMessagesSent($uid) {

    }
}