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
    '1' => array(
      'name' => 'active',
      'color' => '#00FF00',
      'sort' => 1
    ),
    '5' => array(
      'name' => 'inactive',
      'color' => '#666666',
      'sort' => 3
    ),
    '2' => array(
      'name' => 'draft',
      'color' => '#0000FF',
      'sort' => 2
    ),

    '0' => array(
      'name' => 'deleted',
      'color' => '#FF0000',
      'sort' => 4
    ),
  )
);