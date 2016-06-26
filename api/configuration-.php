<?php

/**
 * High priority use case, not super planned out yet.
 * This will be useful in the future as we do a better job organizing our application configuration.
 * We need to distinguish between configuration and application constants.
 */

return array(

    'session' => array(
        'prefix' =>  'directus6_'
    ),

    'filesystem' => array(
        'adapter' => 'local',
        // By default media directory are located at the same level of directus root
        // To make them a level up outsite the root directory
        // use this instead
        // Ex: 'root' => realpath(BASE_PATH.'/../media'),
        // Note: BASE_PATH constant doesn't end with trailing slash
        'root' => BASE_PATH . '/media',
        // This is the url where all the media will be pointing to
        // here all assets will be (yourdomain)/media
        // same with thumbnails (yourdomain)/media/thumbs
        'root_url' => '/media',
        'root_thumb_url' => '/media/thumbs',
        //   'key'    => 's3-key',
        //   'secret' => 's3-key',
        //   'region' => 's3-region',
        //   'version' => 's3-version',
        //   'bucket' => 's3-bucket'
    ),

    'HTTP' => array(
        'forceHttps' => false,
        'isHttpsFn' => function () {
            // Override this check for custom arrangements, e.g. SSL-termination @ load balancer
            return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
        }
    ),

    'mail' => array(
        'from' => array(
            'admin@admin.com' => 'Directus'
        ),
        'transport' => 'mail'
    ),
    // 'SMTP' => array(
    //   'host' => '',
    //   'port' => 25,
    //   'username' => '',
    //   'password' => ''
    // ),

    'hooks' => array(
        'postInsert' => function ($TableGateway, $record, $db, $acl) {

        },
        'postUpdate' => function ($TableGateway, $record, $db, $acl) {
            $tableName = $TableGateway->getTable();
            switch($tableName) {
                // ...
            }
        }
    ),

    // These tables will not be loaded in the directus schema
    'tableBlacklist' => array(

    ),

    'statusMapping' => array(
        '0' => array(
            'name' => __t('status_delete'),
            'color' => '#C1272D',
            'sort' => 3
        ),
        '1' => array(
            'name' => __t('status_active'),
            'color' => '#5B5B5B',
            'sort' => 1
        ),
        '2' => array(
            'name' => __t('status_draft'),
            'color' => '#BBBBBB',
            'sort' => 2
        )
    )

);
