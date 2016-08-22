<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RemoveDirectusFilesURLColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_files', 'url')) {
            $this->remove_column('directus_files', 'url');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_files', 'url')) {
            $this->add_column('directus_files', 'url', 'string', [
                'limit' => 2000
            ]);
        }
    }//down()
}
