<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddNewColumnsToPreferences extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_preferences', 'list_view_options')) {
            $this->add_column('directus_preferences', 'list_view_options', 'text');
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_preferences', 'list_view_options')) {
            $this->remove_column('directus_preferences', 'list_view_options');
        }
    }//down()
}
