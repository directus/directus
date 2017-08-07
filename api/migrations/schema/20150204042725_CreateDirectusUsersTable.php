<?php

/*
CREATE TABLE `directus_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `first_name` varchar(50) DEFAULT '',
  `last_name` varchar(50) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `salt` varchar(255) DEFAULT '',
  `token` varchar(255) DEFAULT '',
  `reset_token` varchar(255) DEFAULT '',
  `reset_expiration` datetime DEFAULT NULL,
  `position` varchar(500) DEFAULT '',
  `email_messages` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `last_access` datetime DEFAULT NULL,
  `last_page` varchar(255) DEFAULT '',
  `ip` varchar(50) DEFAULT '',
  `group` int(11) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `avatar_file_id` int(11) DEFAULT NULL,
  `avatar_is_file` tinyint(1) DEFAULT 0,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusUsersTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_users', [
            'id' => false,
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);
        $t->column('status', 'tinyinteger', [
            'limit' => 1,
            'default' => 1
        ]);
        $t->column('first_name', 'string', [
            'limit' => 50,
            'default' => ''
        ]);
        $t->column('last_name', 'string', [
            'limit' => 50,
            'default' => ''
        ]);
        $t->column('email', 'string', [
            'limit' => 128,
            'null' => false,
            'default' => ''
        ]);
        $t->column('password', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('salt', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('token', 'string', [
            'limit' => 128,
            'null' => true
        ]);
        $t->column('access_token', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('reset_token', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('reset_expiration', 'datetime', [
            'default' => NULL
        ]);
        $t->column('position', 'string', [
            'limit' => 500,
            'default' => ''
        ]);
        $t->column('email_messages', 'tinyinteger', [
            'limit' => 1,
            'default' => 1
        ]);
        $t->column('last_login', 'datetime', [
            'default' => NULL
        ]);
        $t->column('last_access', 'datetime', [
            'default' => NULL
        ]);
        $t->column('last_page', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('ip', 'string', [
            'limit' => 50,
            'default' => ''
        ]);
        $t->column('group', 'integer', [
            'unsigned' => true,
            'default' => NULL
        ]);
        $t->column('avatar', 'string', [
            'limit' => 500,
            'default' => NULL
        ]);
        $t->column('avatar_file_id', 'integer', [
            'unsigned' => true,
            'default' => NULL
        ]);
        $t->column('location', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);
        $t->column('phone', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);
        $t->column('address', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);
        $t->column('city', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);
        $t->column('state', 'string', [
            'limit' => 2,
            'default' => NULL
        ]);

        $t->column('country', 'char', [
            'limit' => 2,
            'default' => NULL
        ]);

        $t->column('zip', 'string', [
            'limit' => 10,
            'default' => NULL
        ]);

        $t->column('language', 'string', [
            'limit' => 8,
            'default' => 'en'
        ]);

        $t->column('timezone', 'string', [
            'limit' => 32,
            'default' => 'America/New_York'
        ]);

        $t->column('invite_token', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('invite_date', 'datetime', [
            'default' => null
        ]);

        $t->column('invite_sender', 'integer', [
            'unsigned' => true,
            'default' => null
        ]);

        $t->column('invite_accepted', 'tinyinteger', [
            'limit' => 1,
            'default' => null
        ]);

        $t->finish();

        $this->add_index('directus_users', 'email', [
            'unique' => true,
            'name' => 'directus_users_email_unique'
        ]);

        $this->add_index('directus_users', 'token', [
            'unique' => true,
            'name' => 'directus_users_token_unique'
        ]);
    }//up()

    public function down()
    {
        $this->drop_table('directus_users');
    }//down()
}
