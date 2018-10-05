<?php

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;

require_once __DIR__ . '/../functions.php';

class Home
{
    public function __invoke(Request $request, Response $response)
    {
        return $response->withJson(['data' => example_get_data()]);
    }
}
