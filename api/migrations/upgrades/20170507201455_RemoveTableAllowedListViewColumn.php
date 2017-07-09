<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RemoveTableAllowedListViewColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_tables', 'allowed_listing_views')) {
            $this->remove_column('directus_tables', 'allowed_listing_views');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_tables', 'allowed_listing_views')) {
            $this->add_column('directus_tables', 'allowed_listing_views', 'string', [
                'limit' => 200,
                'default' => null
            ]);
        }
    }//down()
}
