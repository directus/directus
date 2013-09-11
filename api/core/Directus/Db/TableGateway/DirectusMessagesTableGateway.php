<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Expression;
use Zend\Db\Adapter\Adapter;
use Directus\Db\TableGateway\DirectusMessagesRecepientsTableGateway;

class DirectusMessagesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_messages";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function sendMessage($payload, $recepients, $from) {
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

    private function fetchResponses($messageId) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id', 'from', 'subject', 'message', 'attachment', 'datetime'))
            ->where
                ->equalTo('directus_messages.response_to', $messageId);

        return $this->selectWith($select)->toArray();
    }

    public function fetchMessage($id) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id', 'from', 'subject', 'message', 'attachment','datetime'))
            ->join('directus_messages_recepients', 'directus_messages.id = directus_messages_recepients.message_id', array('recepients' => new Expression("GROUP_CONCAT(recepient)")))
            ->where
                ->equalTo('directus_messages.id', $id);

        $result = $this->selectWith($select)->toArray();
        $result = $result[0];

        $result['attachment'] = array();
        $result['responses'] = array('rows' => $this->fetchResponses($id));

        return $result;
    }

    public function fetchMessagesInbox($uid) {
        $select = new Select('directus_messages');
        $select
            ->join('directus_messages_recepients', 'directus_messages.id = directus_messages_recepients.message_id', array('read'))
            ->where
                ->equalTo('directus_messages_recepients.recepient', $uid);

        $result = $this->selectWith($select)->toArray();

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
                unset($resultLookup[$item['id']]);
                $resultLookup[$item['response_to']]['responses']['rows'][] = $item;
            }
        }

        return array_values($resultLookup);
    }

    public function fetchMessagesSent($uid) {

    }
}