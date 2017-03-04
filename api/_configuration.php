<?php

/**
 * High priority use case, not super planned out yet.
 * This will be useful in the future as we do a better job organizing our application configuration.
 * We need to distinguish between configuration and application constants.
 */

return [
    'session' => [
        'prefix' => 'directus6_'
    ],

    'default_language' => 'en',

    'filesystem' => [
        'adapter' => 'local',
        // By default media directory are located at the same level of directus root
        // To make them a level up outsite the root directory
        // use this instead
        // Ex: 'root' => realpath(BASE_PATH.'/../storage/uploads'),
        // Note: BASE_PATH constant doesn't end with trailing slash
        'root' => BASE_PATH . '/storage/uploads',
        // This is the url where all the media will be pointing to
        // here all assets will be (yourdomain)/storage/uploads
        // same with thumbnails (yourdomain)/storage/uploads/thumbs
        'root_url' => '/storage/uploads',
        'root_thumb_url' => '/storage/uploads/thumbs',
        //   'key'    => 's3-key',
        //   'secret' => 's3-key',
        //   'region' => 's3-region',
        //   'version' => 's3-version',
        //   'bucket' => 's3-bucket'
    ],

    'auth' => [
        'github' => [
            'client_id' => '28206bbaf02c40ac5c73',
            'client_secret' => '80051615c01986ffc107fc2349a296f897c927ea',
            'redirect_url' => 'http://directus.local:8888/auth/github/receive'
        ],
        'facebook' => [
            'client_id'          => '763863823763720',
            'client_secret'      => '9967c7c52bcc4e7985a50ea796b7fc07',
            'redirect_url'       => 'http://directus.local:8888/auth/facebook/receive',
            'graph_api_version'   => 'v2.8',
        ],
        'google' => [
            'client_id'          => '763863823763720',
            'client_secret'      => '9967c7c52bcc4e7985a50ea796b7fc07',
            'redirect_url'       => 'http://directus.local:8888/auth/google/receive',
            'hosted_domain'   => 'http://directus.local:8888',
        ],
        'twitter' => [
            'identifier' => '0Qn38YxczOXJnrTNj4ain9HMm',
            'secret' => 'U71gtjNgvbuTRvb4U16BloXNrPMVAWcLE2Q3mwGqGSC9NLERuD',
            'redirect_url'    => 'http://directus.local:8888/auth/twitter/receive',
        ]
    ],

    'HTTP' => [
        'forceHttps' => false,
        'isHttpsFn' => function () {
            // Override this check for custom arrangements, e.g. SSL-termination @ load balancer
            return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
        }
    ],

    'mail' => [
        'transport' => 'mail',
        'from' => 'admin@admin.com'
    ],

    // 'mail' => [
    //     'transport' => 'smtp',
    //     'from' => 'balaji.tk@sonata-software.com',
    //     'host' => 'email-smtp.us-east-1.amazonaws.com',
    //     'username' => 'AKIAIYYA2WDEHVPMLCYQ',
    //     'password' => 'Apnk/MOZvul2wnZa0LQSsfFb1+dwx6ppTJnuRek2HgDK',
    //     'port' => '25',
    //     'encryption' => 'ssl',
    // ],

    'cors' => [
        'enabled' => false,
        'origin' => '*',
        'headers' => [
            ['Access-Control-Allow-Headers', 'Authorization, Content-Type, Access-Control-Allow-Origin'],
            ['Access-Control-Allow-Credentials', 'false']
        ]
    ],

    'hooks' => [
        'postInsert' => function ($TableGateway, $record, $db) {

        },
        'postUpdate' => function ($TableGateway, $record, $db) {
            $tableName = $TableGateway->getTable();
            switch ($tableName) {
                // ...
            }
        }
    ],

    'feedback' => [
        'token' => 'f034871c04edee6cea0da621ae3b56d79e782973',
        'login' => true
    ],

    // These tables will not be loaded in the directus schema
    'tableBlacklist' => [],

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
