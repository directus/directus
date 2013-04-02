<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

use Directus\Application;
use Directus\Db\TableGateway\AclAwareTableGateway;

class UiOptions extends AclAwareTableGateway {

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
    }

}
