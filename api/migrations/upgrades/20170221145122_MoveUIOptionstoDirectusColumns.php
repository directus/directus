<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class MoveUIOptionsToDirectusColumns extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_columns', 'options')) {
            return;
        }

        $this->add_column('directus_columns', 'options', 'text', [
            'null' => true,
            'default' => NULL
        ]);

        $query = [];
        $query[] = 'SELECT `id`, `table_name`, `column_name`, `ui`';
        $query[] = 'FROM `directus_columns`';
        $query[] = 'ORDER BY `table_name`, `column_name`, `ui`';

        $columns = $this->execute(implode(' ', $query));

        $query = [];
        $query[] = 'SELECT `id`, `name`, `value`, `table_name`, `column_name`, `ui_name`';
        $query[] = 'FROM `directus_ui`';
        $query[] = 'ORDER BY `table_name`, `column_name`, `ui_name`';

        $allOptions = $this->parseColumnsOptions($this->execute(implode(' ', $query)));

        foreach ($columns as $column) {
            $tableName = $column['table_name'];
            $columnName = $column['column_name'];

            if (isset($allOptions[$tableName][$columnName])) {
                $options = [];
                foreach ($allOptions[$tableName][$columnName] as $option) {
                    $options[$option['name']] = $option['value'];
                }

                // Use raw query $this->update quote the json string
                $query = [];
                $query[] = 'UPDATE `directus_columns`';
                $query[] = sprintf("SET `options` = '%s'", json_encode($options));
                $query[] = 'WHERE `id` = ' . $column['id'];

                $this->execute(implode(' ', $query));
            }
        }
    }//up()

    public function down()
    {
        // won't back down
    }//down()

    protected function parseColumnsOptions($options)
    {
        if (!is_array($options)) {
            return [];
        }

        $uiOptions = [];
        foreach($options as $option) {
            if (!isset($uiOptions[$option['table_name']][$option['column_name']])) {
                $uiOptions[$option['table_name']][$option['column_name']] = [];
            }

            $uiOptions[$option['table_name']][$option['column_name']][] = $option;
        }

        return $uiOptions;
    }
}
