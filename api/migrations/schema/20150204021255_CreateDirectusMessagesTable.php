<?php

/*
CREATE TABLE `directus_messages` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `from` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `attachment` int(11) DEFAULT NULL,
  `response_to` int(11) DEFAULT NULL,
  `comment_metadata` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusMessagesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_messages', [
            'id' => false,
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);

        $t->column('from', 'integer', [
            'unsigned' => true,
            'default' => NULL
        ]);
        $t->column('subject', 'string', [
            'limit' => 255,
            'null' => false,
            'default' => ''
        ]);
        $t->column('message', 'text', [
            'null' => false
        ]);
        $t->column('datetime', 'timestamp', [
            'null' => false,
            'default' => 'CURRENT_TIMESTAMP'
        ]);
        $t->column('attachment', 'string', [
            'limit' => 512,
            'default' => NULL
        ]);
        $t->column('response_to', 'integer', [
            'unsigned' => true,
            'default' => NULL
        ]);
        $t->column('comment_metadata', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);

        $t->finish();
    }//up()

    public function down()
    {
        $this->drop_table('directus_messages');
    }//down()
}
