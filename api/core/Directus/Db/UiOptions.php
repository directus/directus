<?php

namespace Directus\Db;

use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

use Directus\Application;
use Directus\Db\TableGateway\AclAwareTableGateway;

class UiOptions extends AclAwareTableGateway {

    public static $_tableName = "directus_ui";

    public function __construct(AdapterInterface $adapter) {
        parent::__construct(self::$_tableName, $adapter);
    }

    /**
     *  Get ui options
     *
     *  @param $tbl_name
     *  @param $col_name
     *  @param $datatype_name
     */
    public function fetchOptions( $tbl_name, $col_name, $datatype_name ) {

        $rowset = $this->select(function(Select $select) use ($tbl_name, $col_name, $datatype_name) {
            $columns = array('id' => 'ui_name','name','value');
            $select->columns($columns)->order('ui_name');
            $select
                ->where
                    ->equalTo('column_name', $col_name)
                    ->AND
                    ->equalTo('table_name', $tbl_name)
                    ->AND
                    ->equalTo('ui_name', $datatype_name);
        });

        $ui_options = array();

        foreach ($rowset as $row) {
            if(!array_key_exists('id', $ui_options))
                $ui_options['id'] = $row['id'];
            $ui_options[$row['name']] = $row['value'];
        }

        return $ui_options;
    }

}
