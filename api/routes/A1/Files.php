<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\Util\StringUtils;
use Directus\View\JsonView;

class Files extends Route
{
    use Traits\ActivityMode;

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

        switch ($app->request()->getMethod()) {
            case 'DELETE':
                // Force delete files
                $requestPayload['id'] = $id;

                // Deletes files
                // TODO: Make the hook listen to deletes and catch ALL ids (from conditions)
                // and deletes every matched files
                $TableGateway->deleteFile($id);

                $conditions = [
                    $TableGateway->primaryKeyFieldName => $id
                ];

                // Delete file record
                // var_dump($conditions);
                $success = $TableGateway->delete($conditions);

                $response = [
                    'success' => $success,
                    'data' => $conditions
                ];

                return $this->app->response($response);

                break;
            case 'POST':
                $requestPayload['user'] = $acl->getUserId();
                $requestPayload['date_uploaded'] = DateUtils::now();

                if (!ArrayUtils::has($requestPayload, 'name')) {
                    return $this->app->response([
                        'error' => [
                            'message' => __t('upload_missing_filename')
                        ],
                        'success' => false
                    ]);
                }

                // When the file is uploaded there's not a data key
                if (array_key_exists('data', $requestPayload)) {
                    $Files = $app->container->get('files');
                    $dataInfo = $Files->getDataInfo($requestPayload['data']);
                    $type = ArrayUtils::get($dataInfo, 'type', ArrayUtils::get($requestPayload, 'type'));

                    if (!$type) {
                        return $this->app->response([
                            'error' => [
                                'message' => __t('upload_missing_file_type')
                            ],
                            'success' => false
                        ]);
                    }

                    if (strpos($type, 'embed/') === 0) {
                        $recordData = $Files->saveEmbedData($requestPayload);
                    } else {
                        $recordData = $Files->saveData($requestPayload['data'], $requestPayload['name']);
                    }

                    $requestPayload = array_merge($recordData, ArrayUtils::omit($requestPayload, ['data', 'name']));
                }
                $newRecord = $TableGateway->updateRecord($requestPayload, $this->getActivityMode());
                $params['id'] = $newRecord['id'];
                break;
            case 'PATCH':
                $requestPayload['id'] = $id;
            case 'PUT':
                if (!is_null($id)) {
                    $TableGateway->updateRecord($requestPayload, $this->getActivityMode());
                    break;
                }
        }

        $Files = new TableGateway($table, $ZendDb, $acl);
        $response = $this->getEntriesAndSetResponseCacheTags($Files, $params);
        if (!$response) {
            $response = [
                'message' => __t('unable_to_find_file_with_id_x', ['id' => $id]),
                'success' => false
            ];
        }

        return $this->app->response($response);
    }

    public function upload()
    {
        $Files = $this->app->container->get('files');
        $result = [];
        foreach ($_FILES as $file) {
            $result[] = $Files->upload($file);
        }

        return $this->app->response($result);
    }

    public function uploadLink()
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $Files = $app->container->get('files');
        $link = $app->request()->post('link');
        $result = [
            'error' => [
                'message' => __t('invalid_unsupported_url')
            ],
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

        return $this->app->response($result);
    }
}
