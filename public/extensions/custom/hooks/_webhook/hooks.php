<?php

return [
    'actions' => [
        // Send an alert when a post is created
        'collection.insert.posts' => function (array $data) {
            $client = new \GuzzleHttp\Client([
                'base_uri' => 'http://example.com'
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
