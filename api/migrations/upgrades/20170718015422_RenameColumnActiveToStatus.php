<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RenameColumnActiveToStatus extends Ruckusing_Migration_Base
{
    protected $tablesName = ['directus_users', 'directus_files'];
    protected $oldColumn = 'active';
    protected $newColumn = 'status';

    public function up()
    {
        $newColumn = $this->newColumn;
        $oldColumn = $this->oldColumn;

        foreach ($this->tablesName as $tableName) {
            if (!$this->has_column($tableName, $newColumn) && $this->has_column($tableName, $oldColumn)) {
                $this->rename_column($tableName, $oldColumn, $newColumn);
            }
        }
    }//up()

    public function down()
    {
        $newColumn = $this->newColumn;
        $oldColumn = $this->oldColumn;

        foreach ($this->tablesName as $tableName) {
            if (!$this->has_column($tableName, $oldColumn) && $this->has_column($tableName, $newColumn)) {
                $this->rename_column($tableName, $newColumn, $oldColumn);
            }
        }
    }//down()
}
