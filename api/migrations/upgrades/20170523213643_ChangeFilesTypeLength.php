<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeFilesTypeLength extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_files', 'type')) {
            $this->change_column('directus_files', 'type', 'string', [
                'limit' => 255,
                'default' => ''
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_files', 'type')) {
            $this->change_column('directus_files', 'type', 'string', [
                'limit' => 50,
                'default' => ''
            ]);
        }
    }//down()
}
