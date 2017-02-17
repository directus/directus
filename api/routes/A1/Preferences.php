<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusPreferencesTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\View\JsonView;

class Preferences extends Route
{
    public function mapPreferences($table)
    {
        $app = $this->app;
        $requestPayload = $app->request()->post();
        $params = $app->request()->get();
        $ZendDb = $app->container->get('zenddb');
        $acl = $app->container->get('acl');
        $currentUserId = $acl->getUserId();

        // $currentUser = $authentication->getUserInfo();
        $params['table_name'] = $table;
        $Preferences = new DirectusPreferencesTableGateway($ZendDb, $acl);
        $TableGateway = new TableGateway('directus_preferences', $ZendDb, $acl);
        switch ($app->request()->getMethod()) {
            case 'PUT':
                $TableGateway->manageRecordUpdate('directus_preferences', $requestPayload, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
                break;
            case 'POST':
                //If Already exists and not saving with title, then updateit!
                $existing = $Preferences->fetchByUserAndTableAndTitle($currentUserId, $table, isset($requestPayload['title']) ? $requestPayload['title'] : null);
                if (!empty($existing)) {
                    $requestPayload['id'] = $existing['id'];
                }
                $requestPayload['user'] = $currentUserId;
                $id = $TableGateway->manageRecordUpdate('directus_preferences', $requestPayload, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
                break;
            case 'DELETE':
                if ($requestPayload['user'] != $currentUserId) {
                    return;
                }

                if (isset($requestPayload['id'])) {
                    echo $TableGateway->delete(['id' => $requestPayload['id']]);
                } else if (isset($requestPayload['title']) && isset($requestPayload['table_name'])) {
                    $jsonResponse = $Preferences->fetchByUserAndTableAndTitle($currentUserId, $requestPayload['table_name'], $requestPayload['title']);
                    if ($jsonResponse['id']) {
                        echo $TableGateway->delete(['id' => $jsonResponse['id']]);
                    } else {
                        echo 1;
                    }
                }

                return;
        }

        //If Title is set then return this version
        if (isset($requestPayload['title'])) {
            $params['newTitle'] = $requestPayload['title'];
        }

        if (isset($params['newTitle'])) {
            $jsonResponse = $Preferences->fetchByUserAndTableAndTitle($currentUserId, $table, $params['newTitle']);
        } else {
            $jsonResponse = $Preferences->fetchByUserAndTableAndTitle($currentUserId, $table);
        }

        if (!$jsonResponse) {
            $app->response()->setStatus(404);
            $jsonResponse = [
                'error' => [
                    'message' => __t('unable_to_find_preferences')
                ],
                'success' => false
            ];
        } else {
            $jsonResponse = [
                'meta' => [
                    'type' => 'item',
                    'table' => 'directus_preferences'
                ],
                'data' => $jsonResponse
            ];
        }

        return $this->app->response($jsonResponse);
    }

    public function getPreferences($table)
    {
        $ZendDb = $this->app->container->get('ZendDb');
        $acl = $this->app->container->get('acl');
        $params = $this->app->request()->get();
        $currentUserId = $acl->getUserId();

        $params['table_name'] = $table;
        $Preferences = new DirectusPreferencesTableGateway($ZendDb, $acl);
        $jsonResponse = $Preferences->fetchSavedPreferencesByUserAndTable($currentUserId, $table);

        return $this->app->response($jsonResponse);
    }
}
