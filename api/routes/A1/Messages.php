<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Application;
use Directus\Application\Route;
use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;
use Directus\Database\TableGateway\DirectusMessagesRecipientsTableGateway;
use Directus\Database\TableGateway\DirectusMessagesTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Exception\Http\ForbiddenException;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\View\JsonView;

class Messages extends Route
{
    public function rows($userId = null)
    {
        $acl = $this->app->container->get('acl');
        $ZendDb = $this->app->container->get('zenddb');
        $currentUserId = $userId !== null ? $userId : $acl->getUserId();
        $params = $this->app->request()->get();

        if (isset($_GET['max_id'])) {
            $messagesRecipientsTableGateway = new DirectusMessagesRecipientsTableGateway($ZendDb, $acl);
            $ids = $messagesRecipientsTableGateway->getMessagesNewerThan($_GET['max_id'], $currentUserId);
            if (sizeof($ids) > 0) {
                $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
                $result = $messagesTableGateway->fetchMessagesInboxWithHeaders($currentUserId, $ids);
                return $this->app->response($result);
            } else {
                $result = $messagesRecipientsTableGateway->countMessages($currentUserId);
                return $this->app->response($result);
            }
        }

        $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
        $result = $this->getDataAndSetResponseCacheTags(
            [$messagesTableGateway, 'fetchMessagesInboxWithHeaders'],
            [$currentUserId, null, $params]
        );

        $meta = ArrayUtils::omit($result, 'data');
        $meta['type'] = 'collection';
        $meta['table'] = 'directus_messages';

        return $this->app->response([
            'meta' => $meta,
            'data' => ArrayUtils::get($result, 'data', [])
        ]);
    }

    public function archiveMessages()
    {
        $app = $this->app;
        $acl = $this->app->container->get('acl');
        $ZendDb = $this->app->container->get('zenddb');
        $currentUserId = $acl->getUserId();

        $request = $app->request();
        $rows = $request->post('rows');
        $messagesIds = [];

        foreach($rows as $row) {
            $messagesIds[] = ArrayUtils::get($row, 'id');
        }

        $messagesIds = array_filter($messagesIds);

        if (!empty($messagesIds)) {
            $messagesTableGateway = new DirectusMessagesRecipientsTableGateway($ZendDb, $acl);
            $success = $messagesTableGateway->archiveMessages($currentUserId, $messagesIds);

            $data = [
                'success' => (bool) $success
            ];
        } else {
            $app->response()->setStatus(404);

            $data = [
                'success' => false,
                'error' => [
                    'message' => __t('no_messages_ids_to_archive_provided')
                ]
            ];
        }

        return JsonView::render($data);
    }

    public function row($id)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $currentUserId = $acl->getUserId();

        $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);

        $result = $this->getDataAndSetResponseCacheTags(
            [$messagesTableGateway, 'fetchMessageWithRecipients'],
            [$id, $currentUserId]
        );

        if (!isset($message)) {
            header('HTTP/1.0 404 Not Found');
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => __t('message_not_found')
                ]
            ]);
        }

        return $this->app->response([
            'meta' => [
                'table' => 'directus_messages',
                'type' => 'item'
            ],
            'data' => $message
        ]);
    }

    public function patchRow($id)
    {
        $this->enforceAddMessages();

        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $currentUserId = $acl->getUserId();

        $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);

        $message = $messagesTableGateway->fetchMessageWithRecipients($id, $currentUserId);

        $ids = [$message['id']];
        $message['read'] = 1;

        foreach ($message['responses']['data'] as &$responseItem) {
            $ids[] = $responseItem['id'];
            $responseItem['read'] = 1;
        }

        // NOTE: Force Read without the need of the user permission to update this table
        $messagesRecipientsTable = new DirectusMessagesRecipientsTableGateway($ZendDb, null);
        $messagesRecipientsTable->markAsRead($ids, $currentUserId);

        $response = [
            'meta' => ['table' => 'directus_messages', 'type' => 'item'],
            'data' => $message
        ];

        return $this->app->response($response);
    }

    public function postRows($responseTo = null)
    {
        $this->enforceAddMessages();

        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $currentUserId = $acl->getUserId();
        $requestPayload = $app->request()->post();
        $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);

        if ($responseTo !== null) {
            $requestPayload['response_to'] = $responseTo;
        }

        $responseTo = ArrayUtils::get($requestPayload, 'response_to');
        if ($responseTo) {
            $parentMessage = $messagesTableGateway->loadEntries(['id' => $responseTo]);
            $requestPayload['comment_metadata'] = ArrayUtils::get($parentMessage, 'comment_metadata');
        }

        // Unpack recipients
        $recipients = explode(',', $requestPayload['recipients']);
        $groupRecipients = [];
        $userRecipients = [];

        foreach ($recipients as $recipient) {
            $typeAndId = explode('_', $recipient);
            if ($typeAndId[0] == 0) {
                $userRecipients[] = $typeAndId[1];
            } else {
                $groupRecipients[] = $typeAndId[1];
            }
        }

        if (count($groupRecipients) > 0) {
            $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
            $result = $usersTableGateway->findActiveUserIdsByGroupIds($groupRecipients);
            foreach ($result as $item) {
                $userRecipients[] = $item['id'];
            }
        }

        if (empty($userRecipients)) {
            $response = [
                'success' => false,
                'error' => [
                    'message' => __t('sending_message_to_an_empty_group')
                ]
            ];

            $app->response()->setStatus(404);

            return $this->app->response($response);
        }

        $userRecipients[] = $currentUserId;

        $id = $messagesTableGateway->sendMessage($requestPayload, array_unique($userRecipients), $currentUserId);

        if ($id) {
            $Activity = new DirectusActivityTableGateway($ZendDb);
            $requestPayload['id'] = $id;
            $Activity->recordMessage($requestPayload, $currentUserId);
        }

        foreach ($userRecipients as $recipient) {
            // Do not the send a notification to the sender
            if ($recipient == $currentUserId) {
                continue;
            }

            $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
            $user = $usersTableGateway->findOneBy('id', $recipient);

            if (isset($user) && $user['email_messages'] == 1) {
                send_message_notification_email($user, $requestPayload);
            }
        }

        $message = $messagesTableGateway->fetchMessageWithRecipients($id, $currentUserId);
        // hotfix: When the message is a response, it will be inside responses.data keys
        if (ArrayUtils::get($requestPayload, 'response_to')) {
            $messageData = ArrayUtils::get($message, 'responses.data', []);
            $message = array_shift($messageData);
        }

        $response = [
            'meta' => ['table' => 'directus_messages', 'type' => 'item'],
            'data' => $message
        ];

        return $this->app->response($response);
    }

    public function recipients()
    {
        $params = $this->app->request()->get();
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');

        $tokens = explode(' ', ArrayUtils::get($params, 'q', ''));

        $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
        $users = $usersTableGateway->findUserByFirstOrLastName($tokens);

        $groupsTableGateway = new DirectusGroupsTableGateway($ZendDb, $acl);
        $groups = $groupsTableGateway->findUserByFirstOrLastName($tokens);

        $result = array_merge($groups, $users);

        return $this->app->response($result);
    }

    public function comments()
    {
        $this->enforceAddMessages();

        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');

        $params = $app->request()->get();
        $requestPayload = $app->request()->post();

        $currentUserId = $acl->getUserId();
        $params['table_name'] = 'directus_messages';
        $TableGateway = new TableGateway('directus_messages', $ZendDb, $acl);

        $userRecipients = [];

        preg_match_all('/@\[([0-9]+)? /', $requestPayload['message'], $results);

        $results = ArrayUtils::get($results, 1);
        if ($results && count($results) > 0) {
            foreach ($results as $userId) {
                $userRecipients[] = $userId;
            }

            $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
            $id = $messagesTableGateway->sendMessage($requestPayload, array_unique($userRecipients), $currentUserId);
            $requestPayload['id'] = $params['id'] = $id;

            preg_match_all('/@\[.*?\]/', $requestPayload['message'], $results);
            $messageBody = $requestPayload['message'];
            $results = $results[0];

            $recipientString = '';
            $len = count($results);
            $i = 0;
            foreach ($results as $result) {
                $newresult = substr($result, 0, -1);
                $newresult = substr($newresult, strpos($newresult, ' ') + 1);
                $messageBody = str_replace($result, $newresult, $messageBody);

                if ($i == $len - 1) {
                    if ($i > 0) {
                        $recipientString .= ' and ' . $newresult;
                    } else {
                        $recipientString .= $newresult;
                    }
                } else {
                    $recipientString .= $newresult . ', ';
                }
                $i++;
            }

            foreach ($userRecipients as $recipient) {
                // Do not the send a notification to the sender
                if ($recipient == $currentUserId) {
                    continue;
                }

                $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
                $user = $usersTableGateway->findOneBy('id', $recipient);

                if (isset($user) && $user['email_messages'] == 1) {
                    send_message_notification_email($user, $requestPayload);
                }
            }
        }

        $requestPayload['datetime'] = DateUtils::now();
        $newRecord = $TableGateway->updateRecord($requestPayload, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
        $params['id'] = $newRecord['id'];

        // GET all table entries
        $entries = $this->getEntriesAndSetResponseCacheTags($TableGateway, $params);

        return $this->app->response($entries);
    }

    private function enforceAddMessages()
    {
        $dbConnection = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $groupTable = new BaseTableGateway('directus_groups', $dbConnection);
        $group = $groupTable->find($acl->getGroupId());

        if (!$group || !$acl->canAdd('directus_messages') || !$acl->canAdd('directus_messages_recipients')) {
            throw new ForbiddenException('You are not allowed to send messages');
        }
    }
}
