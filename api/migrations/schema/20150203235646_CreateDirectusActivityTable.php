<?php

/*
CREATE TABLE `directus_activity` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `identifier` varchar(100) DEFAULT NULL,
  `table_name` varchar(100) NOT NULL DEFAULT '',
  `row_id` int(10) DEFAULT NULL,
  `user` int(10) NOT NULL DEFAULT '0',
  `data` text,
  `delta` text NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `parent_changed` tinyint(1) NOT NULL COMMENT 'Did the top-level record in the change set alter (scalar values/many-to-one relationships)? Or only the data within its related foreign collection records? (*toMany)',
  `datetime` datetime DEFAULT NULL,
  `logged_ip` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Contains history of revisions';
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusActivityTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_activity', [
            'id' => false,
            //'options'=> 'COMMENT="Contains history of revisions"'
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);
        $t->column('type', 'string', ['limit' => 100, 'default' => NULL]);
        $t->column('action', 'string', ['limit' => 100, 'null' => false]);
        $t->column('identifier', 'string', ['limit' => 100, 'default' => NULL]);
        $t->column('table_name', 'string', ['limit' => 100, 'null' => false, 'default' => '']);
        $t->column('row_id', 'integer', ['unsigned' => true, 'default' => 0]);
        $t->column('user', 'integer', ['unsigned' => true, 'null' => false, 'default' => 0]);
        $t->column('data', 'text');
        $t->column('delta', 'text', ['null' => true]);
        $t->column('parent_id', 'integer', ['unsigned' => true, 'default' => NULL]);
        $t->column('parent_table', 'string', ['limit' => 100]);
        $t->column('parent_changed', 'tinyinteger', ['limit' => 1, 'null' => false, 'default' => 0, 'comment' => 'Did the top-level record in the change set alter (scalar values/many-to-one relationships)? Or only the data within its related foreign collection records? (*toMany)']);
        $t->column('datetime', 'datetime', ['default' => NULL]);
        $t->column('logged_ip', 'string', ['limit' => 45, 'default' => NULL]);
        $t->column('user_agent', 'string', ['limit' => 256]);
        $t->finish();

    }//up()

    public function down()
    {
        $this->drop_table('directus_activity');
    }//down()
}
