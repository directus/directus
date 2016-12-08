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
                $Settings->setValues($id, $data);
                break;
        }

        if (!is_null($id)) {
            $response = $Settings->fetchCollection($id);
        } else {
            $response = $Settings->fetchAll();
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