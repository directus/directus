<?php
return array(

  // Unique session naming
  'session' => array(
    'prefix' =>  'directus6_'
  ),

  // @TODO: the option to have multiple filesystem
  'filesystem' => array(
    'adapter' => 'local',
    // By default the media directory is located within the directus root
    // To shift a outsite the Directus root directory use this instead
    // 'root' => realpath(BASE_PATH.'/../media'),
    // Note: BASE_PATH constant does not end with a trailing slash
    'root' => BASE_PATH . '/media',
    // This is the url where all files/media will be pointing to
    // All orignial files will exist at your-domain.com/media
    'root_url' => '/media',
    // All thumbnails will exist at your-domain.com/media/thumbs
    'root_thumb_url' => '/media/thumbs',
    //   'key'    => 's3-key',
    //   'secret' => 's3-key',
    //   'region' => 's3-region',
    //   'version' => 's3-version',
    //   'bucket' => 's3-bucket'
  ),

  // HTTP Settings
  'HTTP' => array(
    'forceHttps' => false,
    'isHttpsFn' => function () {
      // Override this check for custom arrangements, e.g. SSL-termination @ load balancer
      return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
    }
  ),

  // Define this to send emails (eg. forgot password)
  'SMTP' => array(
    'host' => '',
    'port' => 25,
    'username' => '',
    'password' => ''
  ),

  // Use these hooks to extend the base Directus functionality
  'dbHooks' => array(
    'postInsert' => function ($TableGateway, $record, $db, $acl) {
      // ...
    },
    'postUpdate' => function ($TableGateway, $record, $db, $acl) {
      $tableName = $TableGateway->getTable();
      switch($tableName) {
        // ...
      }
    }
  ),

  // These tables will be excluded and won't be managed by Directus
  'tableBlacklist' => array(
    // ...
  ),

  // Below you can adjust the global Status Options
  // These values are used within a table's status column (if included)
  // By default, `active` is the status column's name
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