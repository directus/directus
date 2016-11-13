<?php
return [
    // Unique session naming
    'session' => [
        'prefix' => 'directus6_'
    ],

    // @TODO: the option to have multiple filesystem
    'filesystem' => [
        'adapter' => 'local',
        // By default the media directory is located within the Directus root
        // To shift a outsite the Directus root directory use this instead:
        // 'root' => realpath(BASE_PATH.'/../media'),
        // Note: BASE_PATH constant does not end with a trailing slash
        'root' => BASE_PATH . '/storage/uploads',
        // This is the url where all files/media will be pointing to
        // All orignial files will exist at your-domain.com/media
        'root_url' => '/storage/uploads',
        // All thumbnails will exist at your-domain.com/media/thumbs
        'root_thumb_url' => '/storage/uploads/thumbs',
        //   'key'    => 's3-key',
        //   'secret' => 's3-key',
        //   'region' => 's3-region',
        //   'version' => 's3-version',
        //   'bucket' => 's3-bucket'
    ],

    // HTTP Settings
    'HTTP' => [
        'forceHttps' => false,
        'isHttpsFn' => function () {
            // Override this check for custom arrangements, e.g. SSL-termination @ load balancer
            return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
        }
    ],

    // Define this to send emails (eg. forgot password)
    'mail' => [
        'from' => [
            'directus@localhost' => 'Directus'
        ],
        'transport' => 'mail'
    ],

    'cors' => [
        'enabled' => false,
        'origin' => 'http://webapp.local:8888',
        'headers' => [
            ['Access-Control-Allow-Headers', 'Authorization, Content-Type, Access-Control-Allow-Origin'],
            ['Access-Control-Allow-Credentials', 'false']
        ]
    ],

    // Use these hooks to extend the base Directus functionality
    'hooks' => [
        'postInsert' => function ($TableGateway, $record, $db) {
            // ...
        },
        'postUpdate' => function ($TableGateway, $record, $db) {
            $tableName = $TableGateway->getTable();
            switch ($tableName) {
                // ...
            }
        }
    ],

    // These tables will be excluded and won't be managed by Directus
    'tableBlacklist' => [],

    // Below you can adjust the global Status Options
    // These values are used within a table's status column (if included)
    // By default, `active` is the status column's name
    'statusMapping' => [
        0 => [
            'name' => 'Delete',
            'color' => '#C1272D',
            'sort' => 3
        ],
        1 => [
            'name' => 'Active',
            'color' => '#5B5B5B',
            'sort' => 1
        ],
        2 => [
            'name' => 'Draft',
            'color' => '#BBBBBB',
            'sort' => 2
        ]
    ]
];
