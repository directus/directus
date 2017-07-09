<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddMessagesRecipientsCreateColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->createEntryIfNotExists();

        $query = [];
        $query[] = 'UPDATE `directus_tables`';
        $query[] = 'SET `user_create_column` = "recipient"';
        $query[] = 'WHERE `table_name` = "directus_messages_recipients"';

        $this->query(implode(' ', $query));
    }//up()

    public function down()
    {
        // not back down, this needed to be there from the beginning of time.
    }//down()

    protected function createEntryIfNotExists()
    {
        $record = $this->select_one('SELECT table_name FROM `directus_tables` WHERE `table_name` = "directus_messages_recipients"');

        if (!$record) {
            $this->insert('directus_tables', [
                'table_name' => 'directus_messages_recipients',
                'hidden' => 1,
                'single' => 0,
                'footer' => 0,
                'column_groupings' => NULL,
                'primary_column' => NULL,
                'user_create_column' => 'recipient',
                'user_update_column' => NULL,
                'date_create_column' => NULL,
                'date_update_column' => NULL,
            ]);
        }
    }
}
