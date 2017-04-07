<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RenameListViewDirectusTablesColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_tables', 'list_view') && !$this->has_column('directus_tables', 'allowed_listing_views')) {
            $this->rename_column('directus_tables', 'list_view', 'allowed_listing_views');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_tables', 'allowed_listing_views') && $this->has_column('directus_tables', 'list_view')) {
            $this->rename_column('directus_tables', 'allowed_listing_views', 'list_view');
        }
    }//down()
}
