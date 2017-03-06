<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddUniqueGroupName extends Ruckusing_Migration_Base
{
    protected $tableName = 'directus_groups';
    protected $columnName = 'name';
    protected $indexName = 'directus_groups_name_unique';

    public function up()
    {
        $tableName = $this->tableName;
        $columnName = $this->columnName;
        $indexName = $this->indexName;

        if (!$this->has_index($tableName, $columnName, $indexName)) {
            $this->add_index($tableName, $columnName, [
                'unique' => true,
                'name' => $indexName
            ]);
        }
    }//up()

    public function down()
    {
        $tableName = $this->tableName;
        $columnName = $this->columnName;
        $indexName = $this->indexName;

        if ($this->has_index($tableName, $columnName, $indexName)) {
            $this->remove_index($tableName, $columnName, [
                'unique' => true,
                'name' => $indexName
            ]);
        }
    }//down()
}
