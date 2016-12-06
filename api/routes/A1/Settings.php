<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\View\JsonView;

class Settings extends Route
{
    public function settings($id = null)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();

        $Settings = new DirectusSettingsTableGateway($ZendDb, $acl);

        switch ($app->request()->getMethod()) {
            case 'POST':
            case 'PUT':
                $data = $requestPayload;
                unset($data['id']);
                $Settings->setValues($id, $data);
                break;
        }

        // @TODO: Only fetch one if collection is passed.
        $response = $Settings->fetchAll();
        if (!is_null($id)) {
            $response = array_key_exists($id, $response) ? $response[$id] : null;
        }

        if (!$response) {
            $response = [
                'message' => __t('unable_to_find_setting_collection_x', ['collection' => $id]),
                'success' => false
            ];
        } else {
            $response = [
                'meta' => [
                    'type' => 'item',
                    'table' => 'directus_settings'
                ],
                'data' => $response
            ];

            if (!is_null($id)) {
                $response['meta']['settings_collection'] = $id;
            }
        }

        JsonView::render($response);
    }
}