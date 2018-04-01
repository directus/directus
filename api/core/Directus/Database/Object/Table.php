<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Object;

use Directus\Collection\Arrayable;
use Directus\Database\SchemaManager;
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
class Table implements \ArrayAccess, Arrayable, \JsonSerializable
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
     * Fallback to legacy property
     *
     * @var string
     */
    protected $table_name;

    /**
     * @var Column[]
     */
    protected $columns = [];

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
     * @var string
     */
    protected $sortColumn = null;

    /**
     * @var string
     */
    protected $statusColumn = null;

    /**
     * The table record default status
     *
     * @var string
     */
    protected $defaultStatus;

    /**
     * @var array
     */
    protected $statusMapping;

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
    protected $allowedListingViews;

    /**
     * @var string
     */
    protected $columnGroupings;

    /**
     * @var string
     */
    protected $preview_url;

    /**
     * @var string
     */
    protected $display_template;

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
     * @var array
     */
    protected $avoidSerializing = [
        'writableProperty',
        'readableProperty'
    ];

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

        $this->name = $this->table_name = $name;

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

            // @NOTE: This is a temporary solution
            // to always set the primary column to the first primary key column
            if (!$this->getPrimaryColumn() && $column->isPrimary()) {
                $this->setPrimaryColumn($column->getName());
            } else if (!$this->getSortColumn() && $column->getUI() === SchemaManager::INTERFACE_SORT) {
                $this->setSortColumn($column->getName());
            } else if (!$this->getStatusColumn() && $column->getUI() === SchemaManager::INTERFACE_STATUS) {
                $this->setStatusColumn($column->getName());
                $statusMapping = @json_decode($column->getOptions('status_mapping'), true);
                $this->setStatusMapping($statusMapping);
            } else if (!$this->getDateCreateColumn() && $column->getUI() === SchemaManager::INTERFACE_DATE_CREATED) {
                $this->setDateCreateColumn($column->getName());
            } else if (!$this->getUserCreateColumn() && $column->getUI() === SchemaManager::INTERFACE_USER_CREATED) {
                $this->setUserCreateColumn($column->getName());
            } else if (!$this->getDateUpdateColumn() && $column->getUI() === SchemaManager::INTERFACE_DATE_MODIFIED) {
                $this->setDateUpdateColumn($column->getName());
            } else if (!$this->getUserUpdateColumn() && $column->getUI() === SchemaManager::INTERFACE_USER_MODIFIED) {
                $this->setUserUpdateColumn($column->getName());
            }

            $this->columns[] = $column;
        }

        return $this;
    }

    /**
     * Get table's columns
     *
     * @param array $names
     *
     * @return Column[]
     */
    public function getColumns(array $names = [])
    {
        $columns = $this->columns;

        if ($names) {
            $columns = array_filter($columns, function(Column $column) use ($names) {
                return in_array($column->getName(), $names);
            });
        }

        return $columns;
    }

    /**
     * @param $name
     *
     * @return Column
     */
    public function getColumn($name)
    {
        $columns = $this->getColumns([$name]);

        // get the first matched result
        return array_shift($columns);
    }

    /**
     * Get table primary keys
     *
     * @return array
     */
    public function getPrimaryKeys()
    {
        return array_filter($this->getColumns(), function(Column $column) {
            return $column->isPrimary();
        });
    }

    /**
     * Get table primary keys name
     *
     * @return array
     */
    public function getPrimaryKeysName()
    {
        return array_map(function(Column $column) {
            return $column->getName();
        }, $this->getPrimaryKeys());
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
     * Gets all relational columns
     *
     * @return Column[]
     */
    public function getRelationalColumns()
    {
        return array_filter($this->getColumns(), function(Column $column) {
            return $column->hasRelationship();
        });
    }

    /**
     * Gets all the alias columns
     *
     * @return Column[]
     */
    public function getAliasColumns()
    {
        return array_filter($this->getColumns(), function(Column $column) {
            return $column->isAlias();
        });
    }

    /**
     * Gets all the non-alias columns
     *
     * @return Column[]
     */
    public function getNonAliasColumns()
    {
        return array_filter($this->getColumns(), function(Column $column) {
            return !$column->isAlias();
        });
    }

    /**
     * Gets all the columns name
     *
     * @return array
     */
    public function getColumnsName()
    {
        return array_map(function(Column $column) {
            return $column->getName();
        }, $this->getColumns());
    }

    /**
     * Gets all the relational columns name
     *
     * @return array
     */
    public function getRelationalColumnsName()
    {
        return array_map(function(Column $column) {
            return $column->getName();
        }, $this->getRelationalColumns());
    }

    /**
     * Gets all the alias columns name
     *
     * @return array
     */
    public function getAliasColumnsName()
    {
        return array_map(function(Column $column) {
            return $column->getName();
        }, $this->getAliasColumns());
    }

    /**
     * Gets all the non-alias columns name
     *
     * @return array
     */
    public function getNonAliasColumnsName()
    {
        return array_map(function(Column $column) {
            return $column->getName();
        }, $this->getNonAliasColumns());
    }

    /**
     * Gets the first column that is not part of the system
     *
     * @return Column|null
     */
    public function getFirstNonSystemColumn()
    {
        foreach($this->getColumns() as $column) {
            if ($column->isSystem()) {
                return $column;
            }
        }

        return null;
    }

    /**
     * Table has an `status` column
     *
     * @return bool
     */
    public function hasStatusColumn()
    {
        return $this->getStatusColumn() ? true : false;
    }

    /**
     * Checks whether the table has a sorting column
     *
     * @return bool
     */
    public function hasSortColumn()
    {
        return $this->getSortColumn() ? true : false;
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
     * This column is now acting as the primary key
     * But it can only be a simple primary key, it can be compound
     *
     * @return string
     */
    public function getPrimaryColumn()
    {
        return $this->primaryColumn;
    }

    /**
     * Sets Table status column name
     *
     * @param $name
     *
     * @return Table
     */
    public function setStatusColumn($name)
    {
        $this->statusColumn = $name;

        return $this;
    }

    /**
     * Gets Table status column name
     *
     * @return string
     */
    public function getStatusColumn()
    {
        return $this->statusColumn;
    }

    /**
     * Sets Table sort column name
     *
     * @param $name
     *
     * @return Table
     */
    public function setSortColumn($name)
    {
        $this->sortColumn = $name;

        return $this;
    }

    /**
     * Gets Table sort column name
     *
     * @return string
     */
    public function getSortColumn()
    {
        return $this->sortColumn;
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
     * Set the table customs status mapping
     *
     * @param $mapping
     *
     * @return Table
     */
    public function setStatusMapping($mapping)
    {
        $this->statusMapping = $mapping;

        return $this;
    }

    /**
     * Get the table custom status mapping
     *
     * @return array
     */
    public function getStatusMapping()
    {
        return $this->statusMapping;
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
     * Sets the allowed list views
     *
     * @param $views
     *
     * @return string
     */
    public function setAllowedListingViews($views)
    {
        $this->allowedListingViews = $views;

        return $this;
    }

    /**
     * Gets allowed listing views
     *
     * @return string
     */
    public function getAllowedListingViews()
    {
        return $this->allowedListingViews;
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
     * Sets Table Items preview url
     *
     * @param $url
     *
     * @return Table
     */
    public function setPreviewUrl($url)
    {
        $this->preview_url = $url;

        return $this;
    }

    /**
     * Gets Table Items preview url
     *
     * @return string
     */
    public function getPreviewUrl()
    {
        return $this->preview_url;
    }

    /**
     * Sets Table Items display template
     *
     * Representation value of the table items
     *
     * @param $template
     *
     * @return Table
     */
    public function setDisplayTemplate($template)
    {
        $this->display_template = $template;

        return $this;
    }

    /**
     * Gets Table Items display template
     *
     * Representation value of the table items
     *
     * @return string
     */
    public function getDisplayTemplate()
    {
        return $this->display_template;
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

        if (isset($array['columns'])) {
            foreach($array['columns'] as $column) {
                $columns[] = $column->toArray();
            }
        }

        $array['columns'] = $columns;

        return $array;
    }

    /**
     * @inheritDoc
     */
    function jsonSerialize()
    {
        return $this->toArray();
    }
}
