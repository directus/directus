<?php

/*
CREATE TABLE `directus_messages_recipients` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `message_id` int(11) NOT NULL,
  `recipient` int(11) NOT NULL,
  `read` tinyint(11) NOT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusMessagesRecipientsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_messages_recipients', [
            'id' => false,
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);

        $t->column('message_id', 'integer', [
            'unsigned' => true,
            'null' => false
        ]);

        $t->column('recipient', 'integer', [
            'unsigned' => true,
            'null' => false
        ]);

        $t->column('read', 'tinyinteger', [
            'limit' => 1,
            'null' => false
        ]);

        $t->column('group', 'integer', [
            'unsigned' => true,
            'default' => NULL
        ]);

        $t->column('archived', 'tinyinteger', [
            'limit' => 1,
            'default' => 0,
            'null' => true
        ]);

        $t->finish();
    }//up()

    public function down()
    {
        $this->drop_table('directus_messages_recipients');
    }//down()
}
