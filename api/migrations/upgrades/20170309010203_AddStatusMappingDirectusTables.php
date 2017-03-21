<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddStatusMappingDirectusTables extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_tables', 'status_mapping')) {
            $this->add_column('directus_tables', 'status_mapping', 'text');
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_tables', 'status_mapping')) {
            $this->remove_column('directus_tables', 'status_mapping');
        }
    }//down()
}
