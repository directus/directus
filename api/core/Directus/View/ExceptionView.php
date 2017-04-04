<?php

namespace Directus\View;

use Directus\Application\Application;
use Directus\Database\Exception\CustomUiValidationError;
use Directus\Database\Exception\DuplicateEntryException;
use Directus\Database\Exception\RelationshipMetadataException;
use Directus\Exception\HttpException;
use Directus\Permissions\Exception\AclException;
use Directus\Util\ArrayUtils;

class ExceptionView
{

    /**
     * @param Application $app
     * @param \Exception $exception
     */
    public static function exceptionHandler($app, $exception)
    {

        $response = $app->response();
        $response->header('Content-type', 'application/json');

        $httpCode = 500;
        $data = [
            'success' => false
        ];

        // set default exception
        ArrayUtils::set($data, 'error.message', $exception->getMessage());

        /**
         * Directus\Permissions\Exception\AclException & subclasses
         */
        if ($exception instanceof AclException || is_subclass_of($exception, 'Directus\Permissions\Exception\AclException')) {
            $httpCode = 403;
        } /**
         * Directus\Database\Exception\RelationshipMetadataException
         */
        elseif ($exception instanceof RelationshipMetadataException) {
            $httpCode = 424;
        } elseif ($exception instanceof HttpException) {
            if ($exception->getStatus()) {
                $httpCode = $exception->getStatus();
            }
        }

        /**
         * Directus\Database\Exception\SuppliedArrayAsColumnValue
         */
        // elseif($exception instanceof SuppliedArrayAsColumnValue) {
        //     $httpCode = 422;
        //     $data = array('message' => $exception->getMessage());
        // }

        /**
         * Directus\Database\Exception\CustomUiValidationError
         */
        elseif ($exception instanceof CustomUiValidationError) {
            $httpCode = 422;
        } /**
         * Directus\Database\Exception\DuplicateEntryException
         */
        elseif ($exception instanceof DuplicateEntryException) {
            $httpCode = 409;
        } // @todo log error nonetheless
        else {
            if ('production' !== DIRECTUS_ENV) {
                $data = array_merge($data, [
                    'code' => $exception->getCode(),
                    'class' => get_class($exception),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => $exception->getTrace(),
                    'traceAsString' => $exception->getTraceAsString(),
                ]);
            }
        }

        $data = @json_encode($data);
        if ('production' !== DIRECTUS_ENV) {
            $data = JsonView::format_json($data);
        }

        http_response_code($httpCode);
        header('Content-type: application/json');
        echo $data;
        exit;
    }

}
