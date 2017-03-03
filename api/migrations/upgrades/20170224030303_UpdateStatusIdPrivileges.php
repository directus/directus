<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateStatusIdPrivileges extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_privileges', 'status_id')) {
            $this->change_column('directus_privileges', 'status_id', 'tinyinteger', [
                'limit' => 1,
                'default' => NULL,
                'null' => true
            ]);

            $results = $this->execute('SELECT id FROM `directus_privileges` WHERE status_id = 0');
            foreach ($results as $row) {
                $query = 'UPDATE `directus_privileges` SET `status_id` = NULL WHERE `id` = %s';
                $this->execute(sprintf($query, $row['id']));
            }
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_privileges', 'status_id')) {
            $this->change_column('directus_privileges', 'status_id', 'tinyinteger', [
                'limit' => 1,
                'default' => 0,
                'null' => false
            ]);
        }
    }//down()
}
