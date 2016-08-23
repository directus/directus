<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RenameDirectusColumnsRelatedTableColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_columns', 'related_table') && $this->has_column('directus_columns', 'table_related')) {
            $this->rename_column('directus_columns', 'table_related', 'related_table');
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_columns', 'related_table') && !$this->has_column('directus_columns', 'table_related')) {
            $this->rename_column('directus_columns', 'related_table', 'table_related');
        }
    }//down()
}
