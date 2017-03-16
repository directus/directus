<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateMessagesAttachmentType extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_messages', 'attachment', 'string', [
            'limit' => 512,
            'default' => NULL
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_messages', 'attachment', 'integer', [
            'unsigned' => true,
            'default' => NULL
        ]);
    }//down()
}
