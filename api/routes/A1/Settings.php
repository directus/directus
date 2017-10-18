<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Util\ArrayUtils;
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
            case 'PATCH':
                $data = $requestPayload;
                $insertSettings = function ($values, $collection = null) use ($Settings, $app) {
                    $Files = $app->container->get('files');
                    foreach ($values as $key => $value) {
                        $isLogo = $key === 'cms_thumbnail_url';
                        if (!$isLogo || !is_array($value)) {
                            continue;
                        }

                        if (isset($value['data'])) {
                            $data = ArrayUtils::get($value, 'data', '');
                            $name = ArrayUtils::get($value, 'name', 'unknown.jpg');
                            $fileData = $Files->saveData($data, $name);
                            $newRecord = $Settings->manageRecordUpdate('directus_files', $fileData, RelationalTableGateway::ACTIVITY_ENTRY_MODE_PARENT);

                            $values[$key] = $newRecord['id'];
                        } else {
                            $values[$key] = ArrayUtils::get($value, 'id');
                        }

                        break;
                    }

                    $Settings->setValues($values, $collection);
                };
                if (!is_null($id)) {
                    $insertSettings($data);
                } else {
                    foreach ($data as $collection => $values) {
                        $insertSettings($values, $collection);
                    }
                }
                break;
        }

        $fetchCmsFile = function ($data) use ($ZendDb, $acl) {
            if (!$data) {
                return $data;
            }

            foreach ($data as $key => $value) {
                if ($key === 'cms_thumbnail_url') {
                    $filesTableGateway = new RelationalTableGateway('directus_files', $ZendDb, $acl);
                    $data[$key] = $filesTableGateway->loadEntries(['id' => $value]);
                    break;
                }
            }

            return $data;
        };

        if (!is_null($id)) {
            $response = $this->getDataAndSetResponseCacheTags(
                [$Settings, 'fetchCollection'],
                [$id]
            );
        } else {
            $response = $this->getDataAndSetResponseCacheTags([$Settings, 'fetchAll']);
            $response['global'] = $fetchCmsFile($response['global']);
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

        return $this->app->response($response);
    }
}
