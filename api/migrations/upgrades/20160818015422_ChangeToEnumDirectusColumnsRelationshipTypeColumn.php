<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeToEnumDirectusColumnsRelationshipTypeColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_columns', 'relationship_type')) {
            $this->change_column('directus_columns', 'relationship_type', 'enum', array(
                'values' => array('MANYTOONE', 'MANYTOMANY', 'ONETOMANY'),
                'default' => null
            ));
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_columns', 'relationship_type')) {
            $this->change_column('directus_columns', 'relationship_type', 'string', array(
                    'limit' => 20,
                    'default' => null
                )
            );
        }
    }//down()
}
