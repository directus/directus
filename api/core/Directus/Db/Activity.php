<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

class Activity extends TableGateway {

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

        // @todo why can't we just fetchAll or s'thing?
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();
        $result = array();
        while($row = $rowset->current())
            $result[] = $row;

        return array('rows' => $result);
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
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();
        $result = array();
        while($row = $rowset->current())
            $result[] = $row;

        return $result;
    }

    // function get_revisions($params) {
    //     $row_id = $params['id'];
    //     $table_name = $params['table_name'];
    //     $sql = "SELECT id,action,user,datetime FROM directus_activity WHERE row_id=$row_id AND table_name='$table_name' ORDER BY id DESC";
    //     $sth = $this->dbh->prepare($sql);
    //     $sth->execute();
    //     return $sth->fetchAll(PDO::FETCH_ASSOC);
    // }

}
