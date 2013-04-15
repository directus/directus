<?php

namespace Directus\View;

use Directus\Bootstrap;
use Directus\Acl\Exception\AclException;

class AclExceptionView {

    public static function exceptionHandler($app, $exception) {
        $isAclException = $exception instanceof AclException || is_subclass_of($exception, "Directus\Acl\Exception\AclException");

        if(!$isAclException)
            throw $exception;

        $response = $app->response();
        $response->header('Content-type', 'application/json');
        $app->halt(403, json_encode(array(
            'message' => $exception->getMessage()
        )));
    }

}