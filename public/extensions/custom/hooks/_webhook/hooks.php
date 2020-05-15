<?php

return [
    'actions' => [
        // Post a web callback when an article is created
        'item.create.articles' => function (array $data) {
            $client = new \GuzzleHttp\Client([
                'base_uri' => 'https://example.com'
            ]);

            $data = [
                'type' => 'post',
                'data' => $data
            ];

            $response = $client->request('POST', 'alert', [
                'json' => $data
            ]);
        }
    ]
];
