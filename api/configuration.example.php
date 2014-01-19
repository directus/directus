<?php

/**
 * High priority use case, not super planned out yet.
 * This will be useful in the future as we do a better job organizing our application configuration.
 * We need to distinguish between configuration and application constants.
 */

return array(

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
 	)

);