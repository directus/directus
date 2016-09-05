<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RenameDirectusUsersLocaleColumnToLanguage extends Ruckusing_Migration_Base
{
    protected $tableName = 'directus_users';
    protected $oldColumn = 'locale';
    protected $newColumn = 'language';

    public function up()
    {
        $tableName = $this->tableName;
        $oldColumn = $this->oldColumn;
        $newColumn = $this->newColumn;

        if (!$this->has_column($tableName, $newColumn) && $this->has_column($tableName, $oldColumn)) {
            $this->rename_column($tableName, $oldColumn, $newColumn);
            $this->change_column($tableName, $newColumn, 'string', [
                'limit' => 8,
                'default' => 'en'
            ]);
        }
    }//up()

    public function down()
    {
        $tableName = $this->tableName;
        $oldColumn = $this->oldColumn;
        $newColumn = $this->newColumn;

        if ($this->has_column($tableName, $newColumn) && !$this->has_column($tableName, $oldColumn)) {
            $this->rename_column('directus_users', 'language', 'locale');
            $this->change_column('directus_users', 'language', 'string', [
                'limit' => 32,
                'default' => 'en'
            ]);
        }
    }//down()
}
