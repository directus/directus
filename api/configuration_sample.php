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

  // @TODO: the option to have multiple filesystem
  'filesystem' => array(
      'adapter' => 'local',
      // By default media directory are located at the same level of directus root
      // To make them a level up outsite the root directory
      // use this instead
      // Ex: 'root' => realpath(BASE_PATH.'/../media'),
      // Note: BASE_PATH constant doesn't end with trailing slash
      'root' => BASE_PATH . '/media',
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

  // Define this to send emails e.g. forgot password
  'SMTP' => array(
    'host' => '',
    'port' => 25,
    'username' => '',
    'password' => ''
  ),

  'dbHooks' => array(
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
      'name' => 'Delete',
      'color' => '#C1272D',
      'sort' => 3
    ),
    '1' => array(
      'name' => 'Active',
      'color' => '#5B5B5B',
      'sort' => 1
    ),
    '2' => array(
      'name' => 'Draft',
      'color' => '#BBBBBB',
      'sort' => 2
    )
  )
);