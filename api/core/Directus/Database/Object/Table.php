<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Object;

use Directus\Collection\Arrayable;
use Directus\Util\Traits\ArrayPropertyAccess;
use Directus\Util\Traits\ArrayPropertyToArray;
use Directus\Util\Traits\ArraySetter;

/**
 * Table Object
 *
 * Object that represents a table information
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Table implements \ArrayAccess, Arrayable
{
    use ArraySetter, ArrayPropertyAccess, ArrayPropertyToArray;

    /**
     * Table Identification name
     *
     * Most of the times will be the table name
     *
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var Column[]
     */
    protected $columns;

    /**
     * Column that represents the table main value
     *
     * @var string
     */
    protected $primaryColumn;

    /**
     * The schema/database name
     *
     * @var null|string
     */
    protected $schema = null;

    /**
     * @var bool
     */
    protected $hidden = false;

    /**
     * @var bool
     */
    protected $single = false;

    /**
     * The table record default status
     *
     * @var string
     */
    protected $defaultStatus;

    /**
     * Table status column name
     *
     * @var string
     */
    // TODO: Table can have different status column
    // protected $defaultColumn;

    /**
     * @var string
     */
    protected $userCreateColumn = '';

    /**
     * @var string
     */
    protected $userUpdateColumn = '';

    /**
     * @var string
     */
    protected $dateCreateColumn = '';

    /**
     * @var string
     */
    protected $dateUpdateColumn = '';

    /**
     * Table creation date time
     *
     * @var string
     */
    protected $createdAt;
    protected $dateCreated;

    /**
     * Table comment
     *
     * @var string
     */
    protected $comment;

    /**
     * Number of rows
     *
     * @var int
     */
    protected $rowCount;

    /**
     * @var bool
     */
    protected $footer;

    /**
     * @var string
     */
    protected $listView;

    /**
     * @var string
     */
    protected $columnGroupings;

    /**
     * @var string
     */
    protected $filterColumnBlacklist;

    /**
     * @var array
     */
    protected $readableProperty = ['*'];

    /**
     * @var array
     */
    protected $writableProperty = ['*'];

    /**
     * Table constructor.
     *
     * @param string|array $data
     */
    public function __construct($data)
    {
        if (!is_array($data)) {
            $data = ['name' => $data];
        }

        $this->setData($data);
    }

    /**
     * Set the table id
     *
     * @param $id
     *
     * @return Table
     */
    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    /**
     * Get the table identification name
     *
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set the table name
     *
     * @param $name
     *
     * @return Table
     */
    public function setName($name)
    {
        if (!is_string($name)) {
            throw new \InvalidArgumentException('Table name must be a string. ' . gettype($name) . ' given instead');
        }

        $this->name = $name;

        return $this;
    }

    /**
     * Set the table name
     *
     * @see Table::setName (alias)
     *
     * @param $name
     *
     * @return Table
     */
    public function setTableName($name)
    {
        return $this->setName($name);
    }

    /**
     * Get the table's name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get the table's name
     *
     * @see Table::getName (alias)
     *
     * @return string
     */
    public function getTableName()
    {
        return $this->getName();
    }

    /**
     * Set the table's columns
     *
     * @param array $columns
     *
     * @return Table
     */
    public function setColumns(array $columns)
    {
        foreach($columns as $column) {
            if (is_array($column)) {
                $column = new Column($column);
            }

            if (!($column instanceof Column)) {
                throw new \InvalidArgumentException('Invalid column object. ' . gettype($column) . ' given instead');
            }

            $this->columns[] = $column;
        }

        return $this;
    }

    /**
     * Get table's columns
     *
     * @return Column[]
     */
    public function getColumns()
    {
        return $this->columns;
    }

    /**
     * Get all columns data as array
     *
     * @return array
     */
    public function getColumnsArray()
    {
        return array_map(function(Column $column) {
            return $column->toArray();
        }, $this->getColumns());
    }

    /**
     * Gets all the table alias columns
     *
     * @return array
     */
    public function getAliasColumns()
    {
        $aliasColumns = [];
        foreach($this->getColumns() as $column) {
            if ($column->isAlias()) {
                $aliasColumns[] = $column;
            }
        }

        return $aliasColumns;
    }

    /**
     * Table has an `status` column
     *
     * @return bool
     */
    public function hasStatusColumn()
    {
        return $this->hasColumn(STATUS_COLUMN_NAME);
    }

    /**
     * Whether or not the table has the given column name
     *
     * @param $name
     *
     * @return bool
     */
    public function hasColumn($name)
    {
        $has = false;
        $columns = $this->getColumns();
        foreach($columns as $column) {
            if ($column->getName() == $name) {
                $has = true;
                break;
            }
        }

        return $has;
    }

    /**
     * Set the primary column
     *
     * Do not confuse it with primary key
     *
     * @param $column
     *
     * @return Table
     */
    public function setPrimaryColumn($column)
    {
        $this->primaryColumn = $column;

        return $this;
    }

    /**
     * Get the table main column
     *
     * Do not confuse it with primary key
     *
     * @return string
     */
    public function getPrimaryColumn()
    {
        return $this->primaryColumn;
    }

    /**
     * Set the schema/database the table belongs to
     *
     * @param $schema
     *
     * @return Table
     */
    public function setSchema($schema)
    {
        if ($schema !== null && !is_string($schema)) {
            throw new \InvalidArgumentException('Schema name must be a string. ' . gettype($schema) . ' given instead');
        }

        $this->schema = $schema;

        return $this;
    }

    /**
     * Get the schema/database the table belongs to
     *
     * @return null|string
     */
    public function getSchema()
    {
        return $this->schema;
    }

    /**
     * Set whether the table is hidden
     *
     * @param bool $hidden
     *
     * @return Table
     */
    public function setHidden($hidden)
    {
        $this->hidden = (bool) $hidden;

        return $this;
    }

    /**
     * Whether or not the table is hidden
     *
     * @return bool
     */
    public function getHidden()
    {
        return $this->hidden;
    }

    /**
     * Whether or not the table is hidden
     *
     * @see Table::getHidden (alias)
     *
     * @return bool
     */
    public function isHidden()
    {
        return $this->getHidden();
    }

    /**
     * Set whether a table is single
     *
     * @param $single
     *
     * @return Table
     */
    public function setSingle($single)
    {
        $this->single = (bool) $single;

        return $this;
    }

    /**
     * Whether or not the table is single
     *
     * @return bool
     */
    public function getSingle()
    {
        return $this->single;
    }

    /**
     * Whether or not the table is single
     *
     * @see Table::getSingle (alias)
     *
     * @return bool
     */
    public function isSingle()
    {
        return $this->getSingle();
    }

    /**
     * Set the table records default status
     *
     * @param $status
     *
     * @return Table
     */
    public function setDefaultStatus($status)
    {
        $this->defaultStatus = $status;

        return $this;
    }

    /**
     * Get the table records default status
     *
     * @return string
     */
    public function getDefaultStatus()
    {
        return $this->defaultStatus;
    }

    /**
     * Set the field storing the record's user owner
     *
     * @param $field
     *
     * @return Table
     */
    public function setUserCreateColumn($field)
    {
        $this->userCreateColumn = $field;

        return $this;
    }

    /**
     * Get the field storing the record's user owner
     *
     * @return string
     */
    public function getUserCreateColumn()
    {
        return $this->userCreateColumn;
    }

    /**
     * Set the field storing the user updating the record
     *
     * @param $field
     *
     * @return Table
     */
    public function setUserUpdateColumn($field)
    {
        $this->userUpdateColumn = $field;

        return $this;
    }

    /**
     * Get the field storing the user updating the record
     *
     * @return string
     */
    public function getUserUpdateColumn()
    {
        return $this->userUpdateColumn;
    }

    /**
     * Set the field storing the record created time
     *
     * @param $field
     *
     * @return Table
     */
    public function setDateCreateColumn($field)
    {
        $this->dateCreateColumn = $field;

        return $this;
    }

    /**
     * Get the field storing the record created time
     *
     * @return string
     */
    public function getDateCreateColumn()
    {
        return $this->dateCreateColumn;
    }

    /**
     * Set the field storing the record updated time
     *
     * @param $field
     *
     * @return Table
     */
    public function setDateUpdateColumn($field)
    {
        $this->dateUpdateColumn = $field;
    }

    /**
     * Get the field storing the record updated time
     *
     * @return string
     */
    public function getDateUpdateColumn()
    {
        return $this->dateUpdateColumn;
    }

    /**
     * Set the table created time
     *
     * @param $datetime
     *
     * @return Table
     */
    public function setCreatedAt($datetime)
    {
        $this->createdAt = $datetime;

        return $this;
    }

    /**
     * Set the table created time
     *
     * @see Table::setCreatedAt
     *
     * @param $datetime
     *
     * @return Table
     */
    public function setDateCreated($datetime)
    {
        return $this->setCreatedAt($datetime);
    }

    /**
     * Get the table created time
     *
     * @return string
     */
    public function getCreatedAt()
    {
        return $this->createdAt;
    }

    /**
     * Get the table created time
     *
     * @see Table::getCreatedAt
     *
     * @return string
     */
    public function getDateCreated()
    {
        return $this->getCreatedAt();
    }

    /**
     * Set table comment
     *
     * @param $comment
     *
     * @return Table
     */
    public function setComment($comment)
    {
        $this->comment = $comment;

        return $this;
    }

    /**
     * Get the table comment
     *
     * @return string
     */
    public function getComment()
    {
        return $this->comment;
    }

    /**
     * Set the table row count
     *
     * @param $count
     *
     * @return Table
     */
    public function setRowCount($count)
    {
        $this->rowCount = $count;

        return $this;
    }

    /**
     * Get the table row count
     *
     * @return int
     */
    public function getRowCount()
    {
        return $this->rowCount;
    }

    /**
     * @param $footer
     *
     * @return Table
     */
    public function setFooter($footer)
    {
        $this->footer = (bool) $footer;

        return $this;
    }

    /**
     * @return bool
     */
    public function getFooter()
    {
        return $this->footer;
    }

    /**
     * @param $listView
     *
     * @return string
     */
    public function setListView($listView)
    {
        $this->listView = $listView;

        return $this;
    }

    /**
     * @return string
     */
    public function getListView()
    {
        return $this->listView;
    }

    /**
     * @param $groupings
     *
     * @return Table
     */
    public function setColumnGroupings($groupings)
    {
        $this->columnGroupings = $groupings;

        return $this;
    }

    /**
     * @return string
     */
    public function getColumnGroupings()
    {
        return $this->columnGroupings;
    }

    /**
     * @param $blacklist
     *
     * @return Table
     */
    public function setFilterColumnBlacklist($blacklist)
    {
        $this->filterColumnBlacklist = $blacklist;

        return $this;
    }

    /**
     * @return string
     */
    public function getFilterColumnBlacklist()
    {
        return $this->filterColumnBlacklist;
    }

    public function toArray()
    {
        $array = $this->propertyArray();
        $columns = [];
        foreach($array['columns'] as $column) {
            $columns[] = $column->toArray();
        }

        $array['columns'] = $columns;

        return $array;
    }
}
