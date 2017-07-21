<?php

/*
CREATE TABLE `directus_files` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `name` varchar(255) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `title` varchar(255) DEFAULT '',
  `location` varchar(200) DEFAULT NULL,
  `caption` text,
  `type` varchar(100) DEFAULT '',
  `charset` varchar(50) DEFAULT '',
  `tags` varchar(255) DEFAULT '',
  `width` int(5) DEFAULT '0',
  `height` int(5) DEFAULT '0',
  `size` int(20) DEFAULT '0',
  `embed_id` varchar(200) DEFAULT NULL,
  `user` int(11) NOT NULL,
  `date_uploaded` datetime DEFAULT NULL,
  `storage_adapter` int(11) unsigned DEFAULT NULL COMMENT 'FK `directus_storage_adapters`.`id`',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Directus Files Storage';
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusFilesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_files', [
            'id' => false,
            //'options' => 'COMMENT="Directus Files Storage"'
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
        $t->column('name', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);
        $t->column('title', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('location', 'string', [
            'limit' => 200,
            'default' => NULL
        ]);
        $t->column('caption', 'text');
        $t->column('type', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('charset', 'string', [
            'limit' => 50,
            'default' => ''
        ]);
        $t->column('tags', 'string', [
            'limit' => 255,
            'default' => ''
        ]);
        $t->column('width', 'integer', [
            'unsigned' => true,
            'default' => 0
        ]);
        $t->column('height', 'integer', [
            'unsigned' => true,
            'default' => 0
        ]);
        $t->column('size', 'integer', [
            'unsigned' => true,
            'default' => 0
        ]);
        $t->column('embed_id', 'string', [
            'limit' => 200,
            'default' => NULL
        ]);
        $t->column('user', 'integer', [
            'unsigned' => true,
            'null' => false
        ]);
        // TODO: Make directus set this value to whatever default is on the server (UTC)
        // In MySQL 5.5 and below doesn't support CURRENT TIMESTAMP on datetime as default
        $t->column('date_uploaded', 'datetime', [
            'default' => NULL
        ]);
        $t->column('storage_adapter', 'string', [
            'limit' => 50,
            'default' => NULL
        ]);

        $t->finish();

        $this->insert('directus_files', [
            'id' => 1,
            'name' => '00000000001.jpg',
            'title' => 'Mountain Range',
            'location' => 'Earth',
            'caption' => 'A gorgeous view of this wooded mountain range',
            'type' => 'image/jpeg',
            'charset' => 'binary',
            'tags' => 'trees,rocks,nature,mountains,forest',
            'width' => 1800,
            'height' => 1200,
            'size' => 602058,
            'user' => 1,
            'date_uploaded' => \Directus\Util\DateUtils::now(),
            'storage_adapter' => 'local'
        ]);
    }//up()

    public function down()
    {
        $this->drop_table('directus_files');
    }//down()
}
