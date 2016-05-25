<?php
/*
CREATE TABLE `$uiFilesTableName` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `file_id` int(4) DEFAULT NULL,
    `ui_id` int(4) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateExampleFilesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('example_files', [
                'id' => false,
            ]
        );

        $t->column('id', 'integer', [
                'limit' => 11,
                'unsigned' => true,
                'null' => false,
                'auto_increment' => true,
                'primary_key' => true
            ]
        );

        $t->column('ui_id', 'integer', [
                'limit' => 4,
                'default' => null
            ]
        );

        $t->column('file_id', 'integer', [
                'limit' => 4,
                'default' => null
            ]
        );

        $t->finish();
    }//up()

    public function down()
    {
        $this->drop_table('example_files');
    }//down()
}
