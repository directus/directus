<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateDirectusPreferencesActiveColumnToStatus extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_preferences', 'active') && !$this->has_column('directus_preferences', 'status')) {
            $this->rename_column('directus_preferences', 'active', 'status');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_preferences', 'active') && $this->has_column('directus_preferences', 'status')) {
            $this->rename_column('directus_preferences', 'status', 'active');
        }
    }//down()
}
