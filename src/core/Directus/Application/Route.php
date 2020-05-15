<?php

namespace Directus\Application;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\BadRequestException;
use Directus\Exception\InvalidPayloadException;
use Directus\Hook\Emitter;
use function Directus\is_empty;
use Directus\Util\ArrayUtils;
use Directus\Validator\Validator;

abstract class Route
{
    /**
     * @var Container
     */
    protected $container;

    /**
     * @var Validator
     */
    protected $validator;

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Convert array data into an API output format
     *
     * @param Request $request
     * @param Response $response
     * @param array $data
     * @param array $options
     *
     * @return Response
     */
    public function responseWithData(Request $request, Response $response, $data, array $options = [])
    {
        if (!is_array($data) || is_empty($data)) {
            $data = [];
        }

        $data = $this->getResponseData($request, $response, $data, $options);
        $this->triggerResponseAction($request, $response, $data);

        return $this->respond($response, $data, 'json');
    }

    /**
     * Convert array data into an API output format
     *
     * @param Request $request
     * @param Response $response
     * @param array $data
     * @param array $options
     *
     * @return Response
     */
    public function responseScimWithData(Request $request, Response $response, array $data, array $options = [])
    {
        $data = $this->getResponseData($request, $response, $data, $options);

        return $this->respond($response, $data, 'scim+json');
    }

    /**
     * Pass the data through response hook filters
     *
     * @param Request $request
     * @param Response $response
     * @param array $data
     * @param array $options
     *
     * @return array|mixed|\stdClass
     */
    protected function getResponseData(Request $request, Response $response, array $data, array $options = [])
    {
        return $this->triggerResponseFilter($request, $data, (array) $options);
    }

    /**
     * @param Response $response
     * @param array $data
     * @param string $type
     *
     * @return Response
     */
    protected function respond(Response $response, $data, $type = 'json')
    {
        if (is_empty($data)) {
            return $response->withStatus($response::HTTP_NOT_CONTENT);
        }

        switch ($type) {
            case 'scim+json':
                $response = $response->withScimJson($data,null,JSON_UNESCAPED_UNICODE);
                break;
            case 'json':
            default:
                $response = $response->withJson($data,null,JSON_UNESCAPED_UNICODE);
        }

        return $response;
    }

    /**
     * Trigger a response filter
     *
     * @param Request $request
     * @param array $data
     * @param array $options
     *
     * @return mixed
     */
    protected function triggerResponseFilter(Request $request, array $data, array $options = [])
    {
        $meta = ArrayUtils::get($data, 'meta');
        $method = $request->getMethod();

        $attributes = [
            'meta' => $meta,
            'request' => [
                'path' => $request->getUri()->getPath(),
                'method' => $method
            ]
        ];

        /** @var Emitter $emitter */
        $emitter = $this->container->get('hook_emitter');

        $payload = $emitter->apply('response', $data, $attributes);
        $payload = $emitter->apply('response.' . $method, $payload);

        if (isset($meta['table'])) {
            $emitter->apply('response.' . $meta['table'], $payload);
            $payload = $emitter->apply(sprintf('response.%s.%s',
                $meta['table'],
                $method
            ), $payload);
        }

        return $payload;
    }

    /**
     * Trigger a response action
     * @param  Request  $request
     * @param  Response $response
     * @return void
     */
    protected function triggerResponseAction(Request $request, Response $response, array $data) {
        $uri = $request->getUri();

        $responseInfo = [
            'path' => $uri->getPath(),
            'query' => $uri->getQuery(),
            'status' => $response->getStatusCode(),
            'method' => $request->getMethod(),

            // This will count the total byte length of the data. It isn't
            // 100% accurate, as it will count the size of the serialized PHP
            // array instead of the JSON object. Converting it to JSON before
            // counting would introduce too much latency and the difference in
            // length between the JSON and PHP array is insignificant
            'size' => mb_strlen(serialize((array) $data), '8bit')
        ];

        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run("response", [$responseInfo, $data]);
    }

    /**
     * Parse the output data
     *
     * @param Response $response
     * @param array $data
     * @param array $options
     *
     * @return Response
     */
    public function withData(Response $response, array $data, array $options = [])
    {
        // TODO: Event parsing output
        // This event can guess/change the output from json to xml

        $this->triggerResponseAction($request, $response, $data);

        return $response->withJson($data);
    }

    /**
     * Throws exception when request payload is invalid
     *
     * @param Request $request
     *
     * @throws BadRequestException
     */
    public function validateRequestPayload(Request $request)
    {
        $payload = $request->getParsedBody();
        if ($payload === null) {
            throw new InvalidPayloadException();
        }
    }
}
