<?php

namespace Directus\View;

use Directus\Bootstrap;
use Directus\Acl\Exception\AclException;
use Directus\Db\Exception\DuplicateEntryException;
use Directus\Db\Exception\RelationshipMetadataException;
use Directus\Db\Exception\SuppliedArrayAsColumnValue;
use Directus\Db\Exception\CustomUiValidationError;

class ExceptionView {

    public static function exceptionHandler($app, $exception) {

        $response = $app->response();
        $response->header('Content-type', 'application/json');

        $httpCode = 500;
        $data = array();

        /**
         * Directus\Acl\Exception\AclException & subclasses
         */
        if($exception instanceof AclException || is_subclass_of($exception, "Directus\Acl\Exception\AclException")) {
            $httpCode = 403;
            $data = array('message' => $exception->getMessage());
        }

        /**
         * Directus\Db\Exception\RelationshipMetadataException
         */
        elseif($exception instanceof RelationshipMetadataException) {
            $httpCode = 424;
            $data = array('message' => $exception->getMessage());
        }

        /**
         * Directus\Db\Exception\SuppliedArrayAsColumnValue
         */
        // elseif($exception instanceof SuppliedArrayAsColumnValue) {
        //     $httpCode = 422;
        //     $data = array('message' => $exception->getMessage());
        // }

        /**
         * Directus\Db\Exception\CustomUiValidationError
         */
        elseif($exception instanceof CustomUiValidationError) {
            $httpCode = 422;
            $data = array('message' => $exception->getMessage());
        }

        /**
         * Directus\Db\Exception\DuplicateEntryException
         */
        elseif($exception instanceof DuplicateEntryException) {
            $httpCode = 409;
            $data = array('message' => $exception->getMessage());
        }

        // @todo log error nonetheless
        else {
            $data = array('message' => __t('interal_server_error'));
            if('production' !== DIRECTUS_ENV) {
                $data = array(
                    'code' => $exception->getCode(),
                    'class' => get_class($exception),
                    'message' => $exception->getMessage(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => $exception->getTrace(),
                    'traceAsString' => $exception->getTraceAsString(),
                );
            }
        }

        $data = @json_encode($data);
        if('production' !== DIRECTUS_ENV) {
            $data = JsonView::format_json($data);
        }

        http_response_code($httpCode);
        header('Content-type: application/json');
        echo $data;
        exit;
    }

}
