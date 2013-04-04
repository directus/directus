<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

use Directus\Db\TableGateway\AclAwareTableGateway;

class Activity extends AclAwareTableGateway {

    public function fetchFeed() {
        $columns = array('id','identifier','action','table_name','row_id','user','datetime','type');

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->columns($columns)
            ->order('id DESC');
        $select
            ->where
                ->isNull('parent_id')
                ->OR
                ->equalTo('type', 'MEDIA');

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        return array('rows' => $rowset);
    }

    public function fetchRevisions($row_id, $table_name) {
        $columns = array('id','action','user','datetime');

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->columns($columns)
            ->order('id DESC');
        $select
            ->where
                ->equalTo('row_id', $row_id)
                ->AND
                ->equalTo('table_name', $table_name);

        // @todo why can't we just fetchAll or s'thing?
        // $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        // $rowset = $statement->execute();
        $result = $this->selectWith($select);
        $result = $result->toArray();
        // $result = array();
        // while($row = $rowset->current())
        //     $result[] = $row;
        return $result;
    }

}
