<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddArchivedColumnToMessagesRecipients extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_messages_recipients', 'archived')) {
            $this->add_column('directus_messages_recipients', 'archived', 'tinyinteger', [
                'limit' => 1,
                'default' => 0,
                'null' => true
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_messages_recipients', 'archived')) {
            $this->remove_column('directus_messages_recipients', 'archived');
        }
    }//down()
}
