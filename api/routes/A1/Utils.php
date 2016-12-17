<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Util\StringUtils;
use Directus\View\JsonView;

class Utils extends Route
{
    public function hash()
    {
        $request = $this->app->request();

        $password = $request->post('password');
        if (empty($password)) {
            return JsonView::render([
                'success' => false,
                'error' => [
                    'message' => __t('hash_must_provide_string')
                ]
            ]);
        }

        $salt = !empty($request->post('salt')) ? $request->post('salt') : '';
        $auth = $this->app->container->get('auth');
        $hashedPassword = $auth->hashPassword($password, $salt);

        return JsonView::render([
            'success' => true,
            'data' => [
                'password' => $hashedPassword
            ]
        ]);
    }

    public function randomString()
    {
        // default random string length
        $request = $this->app->request();
        $length = $request->post('length') ? (int)$request->post('length') : 32;

        $randomString = StringUtils::randomString($length);

        return JsonView::render([
            'success' => true,
            'data' => [
                'random' => $randomString
            ]
        ]);
    }
}