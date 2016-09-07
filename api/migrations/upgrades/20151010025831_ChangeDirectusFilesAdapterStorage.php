<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeDirectusFilesAdapterStorage extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_files', 'storage_adapter', 'string', [
            'limit' => 50,
            'default' => NULL
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_files', 'storage_adapter', 'integer', [
            'unsigned' => true,
            'default' => NULL,
            //'COMMENT' =>'FK `directus_storage_adapters`.`id`'
        ]);
    }//down()
}
