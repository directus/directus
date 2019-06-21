<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\SettingsService;
use function Directus\regex_numeric_ids;

class Settings extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->post('', [$this, 'create']);
        $app->get('', [$this, 'all']);
        $app->get('/fields', [$this, 'fields']);
        $app->get('/{id:' . regex_numeric_ids() . '}', [$this, 'read']);
        $app->patch('/{id:' . regex_numeric_ids() . '}', [$this, 'update']);
        $app->patch('', [$this, 'update']);
        $app->delete('/{id:' . regex_numeric_ids() . '}', [$this, 'delete']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function create(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);

        $payload = $request->getParsedBody();
        if (isset($payload[0]) && is_array($payload[0])) {
            return $this->batch($request, $response);
        }

        /**
         * Get interface based input
         */
        $inputData = $this->getInterfaceBasedInput($request, $payload['key']);

        $service = new SettingsService($this->container);
        $responseData = $service->create(
            $inputData,
            $request->getQueryParams()
        );

        $responseData['data']['value'] = $payload['value'];

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function all(Request $request, Response $response)
    {
        $service = new SettingsService($this->container);
        $responseData = $service->findAll(
            $request->getQueryParams()
        );

        /**
         * Get all the fields of settings table to check the interface
         *
         */

        $fieldData = $service->findAllFields(
            $request->getQueryParams()
        );

        /**
         * Generate the response object based on interface/type
         *
         */
        foreach ($fieldData['data'] as $fieldDefinition) {
            // find position of field in $response['data']
            $index = array_search($fieldDefinition['field'], array_column($responseData['data'], 'key'));
            if (false !== $index) {

                switch ($fieldDefinition['type']) {
                    case 'file':
                        if (!empty($responseData['data'][$index]['value'])) {
                            $fileInstance = $service->findFile($responseData['data'][$index]['value']);
                            $responseData['data'][$index]['value'] = null;

                            if (!empty($fileInstance['data'])) {
                                $responseData['data'][$index]['value'] = $fileInstance['data'];
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function fields(Request $request, Response $response)
    {
        $service = new SettingsService($this->container);
        $responseData = $service->findAllFields(
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function read(Request $request, Response $response)
    {
        $service = new SettingsService($this->container);
        $responseData = $service->findByIds(
            $request->getAttribute('id'),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function getInterfaceBasedInput($request, $setting)
    {
        $service = new SettingsService($this->container);
        $fieldData = $service->findAllFields(
            $request->getQueryParams()
        );

        $inputData = $request->getParsedBody();
        foreach ($fieldData['data'] as $key => $value) {
            if ($value['field'] == $setting) {
                if ($inputData['value'] != null) {
                    switch ($value['type']) {
                        case 'file':
                            $inputData['value'] = isset($inputData['value']['id']) ? $inputData['value']['id'] : $inputData['value'];
                            break;
                        case 'array':
                            $inputData['value'] = is_array($inputData['value']) ? implode(",", $inputData['value']) : $inputData['value'];
                            break;
                        case 'json':
                            $inputData['value'] = json_encode($inputData['value']);
                            break;
                    }
                } else {
                    // To convert blank string in null
                    $inputData['value'] = null;
                }
            }
        }
        return $inputData;
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function update(Request $request, Response $response)
    {
        $payload = $request->getParsedBody();
        $id = $request->getAttribute('id');

        if (strpos($id, ',') !== false || (isset($payload[0]) && is_array($payload[0]))) {
            return $this->batch($request, $response);
        }

        $inputData = $request->getParsedBody();
        $service = new SettingsService($this->container);

        /**
         * Get the object of current setting from its setting to check the interface.
         *
         */
        $serviceData = $service->findByIds(
            $request->getAttribute('id'),
            $request->getQueryParams()
        );

        /**
         * Get the interface based input
         *
         */

        $inputData = $this->getInterfaceBasedInput($request, $serviceData['data']['key']);
        $responseData = $service->update(
            $request->getAttribute('id'),
            $inputData,
            $request->getQueryParams()
        );

        $responseData['data']['value'] = $payload['value'];

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function delete(Request $request, Response $response)
    {
        $service = new SettingsService($this->container);

        $id = $request->getAttribute('id');
        if (strpos($id, ',') !== false) {
            return $this->batch($request, $response);
        }

        $service->delete(
            $request->getAttribute('id'),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, []);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws \Exception
     */
    protected function batch(Request $request, Response $response)
    {
        $settingsService = new SettingsService($this->container);

        $payload = $request->getParsedBody();
        $params = $request->getQueryParams();

        $responseData = null;
        if ($request->isPost()) {
            $responseData = $settingsService->batchCreate($payload, $params);
        } else if ($request->isPatch()) {
            $responseData = $settingsService->batchUpdate($payload, $params);
        } else if ($request->isDelete()) {
            $ids = explode(',', $request->getAttribute('id'));
            $settingsService->batchDeleteWithIds($ids, $params);
        }

        return $this->responseWithData($request, $response, $responseData);
    }
}
