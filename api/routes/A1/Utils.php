<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Hash\HashManager;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Directus\View\JsonView;

class Utils extends Route
{
    public function hash()
    {
        $request = $this->app->request();
        $payload = $request->post();
        $string = ArrayUtils::get($payload, 'string');
        $hasher = ArrayUtils::get($payload, 'hasher', 'core');
        $options = ArrayUtils::get($payload, 'options', []);

        if (!is_array($options)) {
            $options = [$options];
        }

        if (empty($string)) {
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => __t('hash_expect_a_string')
                ]
            ]);
        }

        $options['hasher'] = $hasher;
        /** @var HashManager $hashManager */
        $hashManager = $this->app->container->get('hashManager');
        $hashedString = $hashManager->hash($string, $options);

        return $this->app->response([
            'success' => true,
            'data' => [
                'hash' => $hashedString
            ]
        ]);
    }

    public function randomString()
    {
        // TODO: Create a service/function that shared the same code with other part of Directus
        // default random string length
        $request = $this->app->request();
        $length = $request->post('length') ? (int)$request->post('length') : 32;

        $randomString = StringUtils::randomString($length);

        return $this->app->response([
            'success' => true,
            'data' => [
                'random' => $randomString
            ]
        ]);
    }
}
