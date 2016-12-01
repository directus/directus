<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\View\JsonView;

class Files extends Route
{
    public function files($id = null)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();
        $params = $app->request()->get();

        if (!is_null($id))
            $params['id'] = $id;

        $table = 'directus_files';
        $TableGateway = new TableGateway($table, $ZendDb, $acl);
        $activityLoggingEnabled = !(isset($_GET['skip_activity_log']) && (1 == $_GET['skip_activity_log']));
        $activityMode = $activityLoggingEnabled ? TableGateway::ACTIVITY_ENTRY_MODE_PARENT : TableGateway::ACTIVITY_ENTRY_MODE_DISABLED;

        switch ($app->request()->getMethod()) {
            case 'POST':
                $requestPayload['user'] = $acl->getUserId();
                $requestPayload['date_uploaded'] = DateUtils::now();

                // When the file is uploaded there's not a data key
                if (array_key_exists('data', $requestPayload)) {
                    $Files = $app->container->get('files');
                    if (!array_key_exists('type', $requestPayload) || strpos($requestPayload['type'], 'embed/') === 0) {
                        $recordData = $Files->saveEmbedData($requestPayload);
                    } else {
                        $recordData = $Files->saveData($requestPayload['data'], $requestPayload['name']);
                    }

                    $requestPayload = array_merge($recordData, ArrayUtils::omit($requestPayload, ['data', 'name']));
                }
                $newRecord = $TableGateway->manageRecordUpdate($table, $requestPayload, $activityMode);
                $params['id'] = $newRecord['id'];
                break;
            case 'PATCH':
                $requestPayload['id'] = $id;
            case 'PUT':
                if (!is_null($id)) {
                    $TableGateway->manageRecordUpdate($table, $requestPayload, $activityMode);
                    break;
                }
        }

        $Files = new TableGateway($table, $ZendDb, $acl);
        $response = $Files->getEntries($params);
        if (!$response) {
            $response = [
                'message' => __t('unable_to_find_file_with_id_x', ['id' => $id]),
                'success' => false
            ];
        }

        JsonView::render($response);
    }

    public function upload()
    {
        $Files = new \Directus\Files\Files();
        $result = [];
        foreach ($_FILES as $file) {
            $result[] = $Files->upload($file);
        }

        JsonView::render($result);
    }

    public function uploadLink()
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $Files = new \Directus\Files\Files();
        $link = $app->request()->post('link');
        $result = [
            'message' => __t('invalid_unsupported_url'),
            'success' => false
        ];

        $app->response->setStatus(400);

        if (isset($link) && filter_var($link, FILTER_VALIDATE_URL)) {
            $fileData = ['caption' => '', 'tags' => '', 'location' => ''];
            $linkInfo = $Files->getLink($link);

            if ($linkInfo) {
                $currentUserId = $acl->getUserId();
                $app->response->setStatus(200);
                $fileData = array_merge($fileData, $linkInfo);

                $result = [];
                $result[] = [
                    'type' => $fileData['type'],
                    'name' => $fileData['name'],
                    'title' => $fileData['title'],
                    'tags' => $fileData['tags'],
                    'caption' => $fileData['caption'],
                    'location' => $fileData['location'],
                    'charset' => $fileData['charset'],
                    'size' => $fileData['size'],
                    'width' => $fileData['width'],
                    'height' => $fileData['height'],
                    'html' => isset($fileData['html']) ? $fileData['html'] : null,
                    'embed_id' => (isset($fileData['embed_id'])) ? $fileData['embed_id'] : '',
                    'data' => (isset($fileData['data'])) ? $fileData['data'] : null,
                    'user' => $currentUserId
                    //'date_uploaded' => $fileData['date_uploaded'] . ' UTC',
                ];
            }
        }

        JsonView::render($result);
    }
}