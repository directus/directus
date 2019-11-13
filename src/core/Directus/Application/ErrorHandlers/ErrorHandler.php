<?php

namespace Directus\Application\ErrorHandlers;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Database\Exception\InvalidQueryException;
use Directus\Exception\BadRequestExceptionInterface;
use Directus\Exception\ConflictExceptionInterface;
use Directus\Exception\Exception;
use Directus\Exception\ForbiddenException;
use Directus\Exception\NotFoundExceptionInterface;
use Directus\Exception\ServiceUnavailableInterface;
use Directus\Exception\UnauthorizedExceptionInterface;
use Directus\Exception\UnprocessableEntityExceptionInterface;
use Directus\Hook\Emitter;
use Directus\Services\ScimService;
use Directus\Util\ArrayUtils;
use Psr\Http\Message\MessageInterface;
use Slim\Handlers\AbstractHandler;

class ErrorHandler extends AbstractHandler
{
    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected $emitter;

    /**
     * Error handler settings
     *
     * @var array
     */
    protected $settings;

    public function __construct($emitter = null, $settings = [])
    {
        // set_error_handler([$this, 'handleError']);
        // set_exception_handler([$this, 'handleException']);
        // register_shutdown_function([$this, 'handleShutdown']);

        if ($emitter && !($emitter instanceof Emitter)) {
            throw new \InvalidArgumentException(
                sprintf('Emitter must be a instance of \Directus\Hook\Emitter, %s passed instead', get_class($emitter))
            );
        }

        if (!is_array($settings)) {
            throw new \InvalidArgumentException('Settings must be an array');
        }

        $this->emitter = $emitter;
        $this->settings = $settings;
    }

    /**
     * Handles the error
     *
     * @param Request $request
     * @param Response $response
     * @param \Exception|\Throwable $exception
     *
     * @return Response
     */
    public function __invoke(Request $request, Response $response, $exception)
    {
        $data = $this->processException($exception);

        $response = $response->withStatus($data['http_status_code']);
       
        $this->triggerResponseAction($request, $response, $data);

        if ($this->isMessageSCIM($response)) {
            return $response
                ->withJson([
                    'schemas' => [ScimService::SCHEMA_ERROR],
                    'status' => $data['http_status_code'],
                    'detail' => $data['error']['message']
                ]);
        }

        return $response
            ->withJson(['error' => $data['error']])
            ->withHeader('Access-Control-Allow-Origin', $request->getHeader('Origin'));
    }

    /**
     * Returns an exception error and http status code information
     *
     * http_status_code and error key returned in the array
     *
     * @param \Exception|\Throwable $exception
     *
     * @return array
     */
    public function processException($exception)
    {
        $productionMode = ArrayUtils::get($this->settings, 'env', 'development') === 'production';
        $this->trigger($exception);

        $message = $exception->getMessage() ?: 'Unknown Error';
        $code = null;
        // Not showing internal PHP errors (for PHP7) for production
        if ($productionMode && $this->isError($exception)) {
            $message = 'Internal Server Error';
        }

        if (!$productionMode && ($previous = $exception->getPrevious())) {
            $message .= ' ' . $previous->getMessage();
        }

        if ($exception instanceof \PDOException) {
            $message = $this->cleanDBMessage($exception);
        }

        if ($exception instanceof Exception) {
            $code = $exception->getErrorCode();
            $httpStatusCode = $exception->getStatusCode() ?? 500;
        } else {
            $httpStatusCode = 500;
        }

        // TODO: Implement a method/property that returns the exception type/status
        if ($exception instanceof BadRequestExceptionInterface) {
            $httpStatusCode = 400;
        } else if ($exception instanceof NotFoundExceptionInterface) {
            $httpStatusCode = 404;
        } else if ($exception instanceof UnauthorizedExceptionInterface) {
            $httpStatusCode = 401;
        } else if ($exception instanceof ForbiddenException) {
            $httpStatusCode = 403;
        } else if ($exception instanceof ConflictExceptionInterface) {
            $httpStatusCode = 409;
        } else if ($exception instanceof UnprocessableEntityExceptionInterface) {
            $httpStatusCode = 422;
        } else if ($exception instanceof ServiceUnavailableInterface) {
            $httpStatusCode = 503;
        }

        $data = [
            'code' => $code,
            'message' => $message
        ];

        if ($exception instanceof InvalidQueryException) {
            $data['query'] = $exception->getQuery();
        }

        if (!$productionMode) {
            $data = array_merge($data, [
                'class' => get_class($exception),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                // Do not output the trace
                // it can be so long or complex
                // that json_encode fails
                // 'trace' => $exception->getTrace(),
                // maybe as string, but let's get rid of them, for the best
                // and look at the logs instead
                // 'traceAsString' => $exception->getTraceAsString(),
            ]);
        }

        return [
            'http_status_code' => $httpStatusCode,
            'error' => $data
        ];
    }

    /**
     * Checks whether the exception is an error
     *
     * @param $exception
     *
     * @return bool
     */
    protected function isError($exception)
    {
        return $exception instanceof \Error
            || $exception instanceof \ErrorException;
    }

    /**
     * Triggers application error event
     *
     * @param \Throwable $e
     */
    protected function trigger($e)
    {
        if ($this->emitter) {
            $this->emitter->run('application.error', $e);
        }
    }

    /**
     * @param MessageInterface $message
     *
     * @return mixed|string
     */
    protected function isMessageSCIM(MessageInterface $message)
    {
        $contentType = $message->getHeaderLine('Content-Type');

        if (preg_match('/scim\+json/', $contentType, $matches)) {
            return true;
        }

        return false;
    }

    /**
     * Clean Database warning/error message
     *
     * @param Exception|\Throwable $exception
     *
     * @return string
     */
    protected function cleanDBMessage($exception)
    {
        $message = $exception->getMessage();

        if (!($exception instanceof \PDOException)) {
            return $message;
        }

        // Error: 1265 SQLSTATE: 01000 (WARN_DATA_TRUNCATED)
        // Message: Data truncated for column '%s' at row %ld
        // Ref: https://dev.mysql.com/doc/refman/5.5/en/error-messages-server.html#error_warn_data_truncated
        if (preg_match('/Data truncated for column \'(.*)\'/', $message, $matches)) {
            $message = sprintf('Warning: Data is too large for "%s" column length and may be truncated', $matches[1]);
        }

        return $message;
    }

    /**
     * Trigger a response action
     * @param  Request  $request
     * @param  Response $response
     * @return void
     */
    protected function triggerResponseAction(Request $request, Response $response, array $data) {
        if (!$this->emitter) return;

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

        $this->emitter->run("response", [$responseInfo, $data]);
    }
}
