<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

class Activity extends TableGateway {

    public function fetchFeed() {
        $columns = array('id','identifier','action','table_name','row_id','user','datetime','type');

        $sql = new Sql($this->adapter);
        $select = $sql->select();
        $select->from($this->table)
            ->columns($columns)
            ->order('id DESC');
        $select
            ->where
                ->isNull('parent_id')
                ->OR
                ->equalTo('type', 'MEDIA');

        // @todo why can't we just fetchAll or s'thing?
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();
        $result = array();
        while($row = $rowset->current())
            $result[] = $row;

        return array('rows' => $result);
    }

}
