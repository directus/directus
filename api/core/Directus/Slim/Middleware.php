<?php

namespace Directus\Slim;

use Directus\Authentication\Provider as Auth;
use Directus\View\JsonView;
use Slim\Slim;

class Middleware
{

    public static $refusalResponseTypes = ['redirect', 'json'];

    protected static function validateResponseType($responseType)
    {
        if (!in_array($responseType, self::$refusalResponseTypes)) {
            throw new \RuntimeException('Invalid refusal $responseType: ' . $responseType);
        }
    }

    public static function refuseWithErrorMessage($errorMessage, $responseType = 'redirect', $errorCode = '403 Forbidden')
    {
        header('HTTP/1.1 ' . $errorCode);
        $app = Slim::getInstance();
        switch ($responseType) {
            case 'json':
                $jsonResponse = [
                    'success' => false,
                    'message' => $errorMessage
                ];
                $view = $app->view();
                $view->setData('jsonResponse', $jsonResponse);
                \Directus\Slim\Middleware::renderJson();
                break;
            case 'redirect':
            default:
                $app->flash('error', $errorMessage);
                $app->redirect(ROOT_URL);
        }
        // How to interrupt, without exiting?
        // return false;
        // Hmmm interrupts output:
        // $app->halt(401);
        exit;
    }

    public static function refuseUnauthenticatedUsers($responseType = 'redirect')
    {
        self::validateResponseType($responseType);
        return function () use ($responseType) {
            if (Auth::loggedIn()) {
                return true;
            }
            $errorMessage = 'You must be logged in to perform that action.';
            \Directus\Slim\Middleware::refuseWithErrorMessage($errorMessage, $responseType);
        };
    }

    public static function refuseAuthenticatedUsers($responseType = 'redirect')
    {
        self::validateResponseType($responseType);
        return function () use ($responseType) {
            if (!Auth::loggedIn()) {
                return true;
            }
            $errorMessage = 'You must be logged out to perform that action.';
            \Directus\Slim\Middleware::refuseWithErrorMessage($errorMessage, $responseType);
        };
    }

    public static function renderJson()
    {
        $app = \Slim\Slim::getInstance();
        $view = $app->view();
        $viewData = $view->getData();
        if (!array_key_exists('jsonResponse', $viewData)) {
            throw new \RuntimeException('renderJson middleware expected `jsonResponse` key within the view data array.');
        }
        JsonView::render($viewData['jsonResponse']);
    }

}
