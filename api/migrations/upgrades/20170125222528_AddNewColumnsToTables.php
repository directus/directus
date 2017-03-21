<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddNewColumnsToTables extends Ruckusing_Migration_Base
{
    public function up()
    {
        $tableName = 'directus_tables';
        if (!$this->has_column($tableName, 'display_template')) {
            $this->add_column($tableName, 'display_template', 'string', [
                'limit' => 255,
                'null' => true,
                'default' => ''
            ]);
        }

        if (!$this->has_column($tableName, 'preview_url')) {
            $this->add_column($tableName, 'preview_url', 'string', [
                'limit' => 255,
                'null' => true,
                'default' => ''
            ]);
        }

        if (!$this->has_column($tableName, 'sort_column')) {
            $this->add_column($tableName, 'sort_column', 'string', [
                'limit' => 64,
                'default' => NULL
            ]);
        }

        if (!$this->has_column($tableName, 'status_column')) {
            $this->add_column($tableName, 'status_column', 'string', [
                'limit' => 64,
                'default' => NULL
            ]);
        }
    }//up()

    public function down()
    {
        $tableName = 'directus_tables';
        $columns = [
            'display_template',
            'preview_url',
            'sort_column',
            'status_column'
        ];

        foreach($columns as $column) {
            if ($this->has_column($tableName, $column)) {
                $this->remove_column($tableName, $column);
            }
        }
    }//down()
}
