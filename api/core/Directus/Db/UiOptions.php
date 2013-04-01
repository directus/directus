<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

use Directus\Application;

class UiOptions extends TableGateway {

    /**
     *  Get ui options
     *
     *  @param $tbl_name
     *  @param $col_name
     *  @param $datatype_name
     */
    public function fetchOptions( $tbl_name, $col_name, $datatype_name ) {
        $columns = array('id' => 'ui_name','name','value');
        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->columns($columns)
            ->from($this->table)
            ->order('ui_name');
        $select
            ->where
                ->equalTo('column_name', $col_name)
                ->AND
                ->equalTo('table_name', $tbl_name)
                ->AND
                ->equalTo('ui_name', $datatype_name);

        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();

        $ui_options = array();

        foreach ($rowset as $row) {
            if(!array_key_exists('id', $ui_options))
                $ui_options['id'] = $row['id'];
            $ui_options[$row['name']] = $row['value'];
        }

        return $ui_options;

        // The above refactor produces identical output to the old layer's output, in all cases so far.

        // This original logic is mystifying -
        // ex., this query seems to demonstrate that only one UI will ever come through this function:
        // SELECT * FROM `directus_ui` WHERE `column_name` = 'room_id' AND `table_name` = 'classes' ORDER BY `ui_name` ASC;
        // ... since the combination of table+column names seems to be unique.
        // @todo confirm

        // $ui;
        // $result = array();
        // $item = array();
        // $sth = $this->dbh->query("SELECT ui_name as id, name, value FROM directus_ui WHERE column_name='$col_name' AND table_name='$tbl_name' AND ui_name='$datatype_name' ORDER BY ui_name");
        // while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
        //     //first case
        //     if (!isset($ui)) { $item['id'] = $ui = $row['id']; }
        //     //new ui = new item
        //     if ($ui != $row['id']) {
        //         array_push($result, $item);
        //         $item = array();
        //         $item['id'] = $ui = $row['id'];
        //     }
        //     $item[$row['name']] = $row['value'];
        // };
        // if (count($item) > 0) {
        //     array_push($result, $item);
        // }
        // if (sizeof($result)) {
        //     return $result[0];
        // }
        // return array();
        }

}
