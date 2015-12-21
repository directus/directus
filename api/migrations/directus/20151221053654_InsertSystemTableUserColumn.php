<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class InsertSystemTableUserColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->execute("INSERT INTO `directus_tables` (`table_name`, `hidden`, `single`, `is_junction_table`, `footer`, `list_view`, `column_groupings`, `primary_column`, `user_create_column`, `user_update_column`, `date_create_column`, `date_update_column`)
      VALUES
        ('directus_bookmarks',1,0,0,0,NULL,NULL,NULL,'user',NULL,NULL,NULL),
        ('directus_files',1,0,0,0,NULL,NULL,NULL,'user',NULL,NULL,NULL),
        ('directus_preferences',1,0,0,0,NULL,NULL,NULL,'user',NULL,NULL,NULL);");
    }//up()

    public function down()
    {
    }//down()
}
