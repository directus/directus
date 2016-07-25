<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RemoveDirectusFilesURLColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->remove_column('directus_files', 'url');
    }//up()

    public function down()
    {
        $this->add_column('directus_files', 'url', 'string', [
            'limit' => 2000
        ]);
    }//down()
}
