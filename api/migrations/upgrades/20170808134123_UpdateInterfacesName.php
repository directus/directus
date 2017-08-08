<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateInterfacesName extends Ruckusing_Migration_Base
{
    protected $tableName = 'directus_columns';
    protected $names = [
        'checkbox' => 'toggle',
        'jsoneditor' => 'json',
        'enum' => 'dropdown_enum',
        'instructions' => 'section_break',
        'multi_select' => 'checkboxes',
        'radiobuttons' => 'radio_buttons',
        'select' => 'dropdown',
        'textinput' => 'text_input',
        'wysiwyg' => 'wysiwyg_full'
    ];

    public function up()
    {
        foreach ($this->names as $old => $new) {
            $this->updateUI($this->tableName, $old, $new);
        }

        $this->updateSystemUI($this->tableName, 'id', 'numeric', 'primary_key');
        $this->updateSystemUI($this->tableName, 'sort', 'numeric', 'sort');
    }//up()

    public function down()
    {
        foreach ($this->names as $old => $new) {
            $this->updateUI($this->tableName, $new, $old);
        }

        $this->updateSystemUI($this->tableName, 'id', 'primary_key', 'numeric');
        $this->updateSystemUI($this->tableName, 'sort', 'sort', 'numeric');
    }//down()

    protected function updateUI($table, $from, $to)
    {
        $query = sprintf('UPDATE `%s` SET `ui` = "%s" WHERE `ui` = "%s"', $table, $to, $from);

        $this->execute($query);
    }

    protected function updateSystemUI($table, $name, $from, $to)
    {
        $query = sprintf('UPDATE `%s` SET `ui` = "%s" WHERE `ui` = "%s" AND `column_name` = "%s"', $table, $to, $from, $name);

        $this->execute($query);
    }
}
