<?php

return [
    // Unique session naming
    'session' => [
        'prefix' => 'directus6_'
    ],

    'cache' => [
//        'pool' => [
//            'adapter' => 'apc'
//        ],
//        'pool' => [
//            'adapter' => 'apcu'
//        ],
//        'pool' => [
//            'adapter' => 'filesystem',
//            'path' => '../cache/', // relative to the api directory
//        ],
//        'pool' => [
//            'adapter'   => 'memcached',
//            'host'      => 'localhost',
//            'port'      => 11211
//        ],
//        'pool' => [
//            'adapter'   => 'redis',
//            'host'      => 'localhost',
//            'port'      => 6379
//        ],
        'enabled' => true,
        'response_ttl' => 3600 // seconds
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
        //  'key'    => 's3-key',
        //  'secret' => 's3-key',
        //  'region' => 's3-region',
        //  'version' => 's3-version',
        //  'bucket' => 's3-bucket',
        //  // Digital Ocean endpoint
        //  'endpoint' => ''
        //  'visibility' => 'public'
    ],

    // Third-party authentication options
    'auth' => [
        // 'github' => [
        //     'client_id' => '',
        //     'client_secret' => ''
        // ],
        // 'facebook' => [
        //     'client_id'          => '',
        //     'client_secret'      => '',
        //     'graph_api_version'  => 'v2.8',
        // ],
        // 'google' => [
        //     'client_id'       => '',
        //     'client_secret'   => '',
        //     'hosted_domain'   => '*',
        // ],
        // 'twitter' => [
        //     'identifier'   => '',
        //     'secret'       => ''
        // ]
    ],

    // HTTP Settings
    'http' => [
        'emulate_enabled' => false,
        // can be null, or an array list of method to be emulated
        // Ex: ['PATH', 'DELETE', 'PUT']
        // 'emulate_methods' => null,
        'force_https' => false,
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
        'origin' => '*', // can be a comma separated value or array of hosts
        'headers' => [
            'Access-Control-Allow-Headers' => 'Authorization, Content-Type, Access-Control-Allow-Origin',
            'Access-Control-Allow-Credentials' => 'false'
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

    'filters' => [
        // 'table.insert.products:before' => \Directus\Customs\Hooks\BeforeInsertProducts::class,
        'response.directus_users.get' => function ($payload) {
            /*
            // assigned by reference to directly change the value on $payload->data
            $data = &$payload->data;
            $meta = $payload->meta;

            // add a new attribute merging the first and last name
            $formatOutput = function (&$row) {
                $format = '%s %s';
                $fname = \Directus\Util\ArrayUtils::get($row, 'first_name', '');
                $lname = \Directus\Util\ArrayUtils::get($row, 'last_name', '');
                $row['name'] = sprintf($format, $fname, $lname);
            };

            if ($meta['type'] === 'collection') {
                // collection on API 1 are wrapped inside 'rows' attributes
                $attributeName = $payload->apiVersion === 1 ? 'rows' : 'data';
                $rows =  $data[$attributeName];

                foreach ($rows as $key => $row) {
                    $formatOutput($data[$attributeName][$key]);
                }
            } else {
                // all content on API 1.1 are wrapped inside 'data'
                if ($payload->apiVersion > 1) {
                    $formatOutput($data['data']);
                } else {
                    $formatOutput($data);
                }
            }
            */
            return $payload;
        }
    ],

    'feedback' => [
        'token' => 'a-kind-of-unique-token',
        'login' => true
    ],

    // These tables will be excluded and won't be managed by Directus
    'tableBlacklist' => [],

    // Below you can adjust the global Status Options
    // These values are used within a table's status column (if included)
    // By default, `active` is the status column's name
    'statusMapping' => [
        0 => [
            'name' => 'Deleted',
            'text_color' => '#FFFFFF',
            'background_color' => '#F44336',
            'subdued_in_listing' => true,
            'show_listing_badge' => true,
            'hidden_globally' => true,
            'hard_delete' => false,
            'published' => false,
            'sort' => 3
        ],
        1 => [
            'name' => 'Published',
            'text_color' => '#FFFFFF',
            'background_color' => '#3498DB',
            'subdued_in_listing' => false,
            'show_listing_badge' => false,
            'hidden_globally' => false,
            'hard_delete' => false,
            'published' => true,
            'sort' => 1
        ],
        2 => [
            'name' => 'Draft',
            'text_color' => '#999999',
            'background_color' => '#EEEEEE',
            'subdued_in_listing' => true,
            'show_listing_badge' => true,
            'hidden_globally' => false,
            'hard_delete' => false,
            'published' => false,
            'sort' => 2
        ]
    ],

    // This is the configuration for the Directus Dynamic Thumbnailer
    // It creates image thumbnails on the fly, simply by requesting them. For example:
    // http://directus.example.com/thumbnail/100/100/crop/best/original-image-name.jpg
    'thumbnailer' => [
        '404imageLocation' => __DIR__ . '/../thumbnail/img-not-found.png',
        'supportedThumbnailDimensions' => [
            // width x height
            // '100x100',
            // '300x200',
            // '100x200',
        ],
        'supportedQualityTags' => [
            'poor' => 25,
            'good' => 50,
            'better' => 75,
            'best' => 100,
        ],
        'supportedActions' => [
            'contain' => [
                'options' => [
                    'resizeCanvas' => false, // http://image.intervention.io/api/resizeCanvas
                    'position' => 'center',
                    'resizeRelative' => false,
                    'canvasBackground' => 'ccc', // http://image.intervention.io/getting_started/formats
                 ]
             ],
            'crop' => [
                'options' => [
                    'position' => 'center', // http://image.intervention.io/api/fit
                 ]
            ],
        ]
    ]
];
