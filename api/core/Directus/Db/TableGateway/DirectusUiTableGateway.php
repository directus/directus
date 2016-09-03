<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;

class DirectusUiTableGateway extends AclAwareTableGateway
{

    public static $_tableName = "directus_ui";

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    /**
     *  Get ui options
     *
     * @param $tbl_name
     * @param $col_name
     * @param $datatype_name
     */
    public function fetchOptions($tbl_name, $col_name, $datatype_name)
    {

        $rowset = $this->select(function (Select $select) use ($tbl_name, $col_name, $datatype_name) {
            $columns = array('id' => 'ui_name', 'name', 'value');
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
            if (!array_key_exists('id', $ui_options))
                $ui_options['id'] = $row['id'];
            $ui_options[$row['name']] = $row['value'];
        }

        return $ui_options;
    }

    /**
     *  Get ui options the exist both in directus_columns and directus_ui
     *
     */
    public function fetchExisting()
    {
        $select = new Select($this->table);

        // @TODO: columns created outside Directus will not exists on directus columns table
        // This will cause to all these columns to not have any options related to it.
        // $select->join(
        //     'directus_columns',
        //     'directus_ui.column_name = directus_columns.column_name AND directus_ui.table_name = directus_columns.table_name AND directus_ui.ui_name = directus_columns.ui',
        //     array(),
        //     $select::JOIN_INNER
        // );
        return $this->selectWith($select);
    }

}
