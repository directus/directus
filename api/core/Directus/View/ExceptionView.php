<?php

namespace Directus\View;

use Directus\Bootstrap;
use Directus\Acl\Exception\AclException;
use Directus\Db\Exception\RelationshipMetadataException;

class ExceptionView {

    public static function exceptionHandler($app, $exception) {

        $response = $app->response();

        /**
         * Directus\Acl\Exception\AclException & subclasses
         */
        if($exception instanceof AclException || is_subclass_of($exception, "Directus\Acl\Exception\AclException")) {
            $response->header('Content-type', 'application/json');
            $app->halt(403, json_encode(array(
                'message' => $exception->getMessage()
            )));
        }

        /**
         * Directus\Db\Exception\RelationshipMetadataException
         */
        elseif($exception instanceof RelationshipMetadataException) {
            $response->header('Content-type', 'application/json');
            $app->halt(424, json_encode(array(
                'message' => $exception->getMessage()
            )));
        }

        else {
            // Re-throw
            throw $exception;
        }
    }

}