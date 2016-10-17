<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Object;

use Directus\Util\Traits\ArrayPropertyAccess;
use Directus\Util\Traits\ArraySetter;

/**
 * Column relationship
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class ColumnRelationship implements \ArrayAccess
{
    use ArraySetter, ArrayPropertyAccess;

    /**
     * @var string
     */
    protected $type;

    /**
     * @var string
     */
    protected $relatedTable;

    /**
     * @var string
     */
    protected $junctionTable;

    /**
     * @var string
     */
    protected $junctionKeyRight;

    /**
     * @var string
     */
    protected $junctionKeyLeft;

    /**
     * @var array
     */
    protected $readableProperty = [];

    /**
     * @var array
     */
    protected $writableProperty = [];

    /**
     * ColumnRelationship constructor.
     *
     * @param array $data
     */
    public function __construct(array $data)
    {
        $this->setData($data);

        $this->readableProperty = $this->writableProperty = [
            'type',
            'related_table',
            'junction_table',
            'junction_left_key',
            'junction_right_key'
        ];
    }

    /**
     * Set the relationship type
     *
     * @param $type
     *
     * @return ColumnRelationship
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get the relationship type
     *
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Set the related table name
     *
     * @param $table
     *
     * @return ColumnRelationship
     */
    public function setRelatedTable($table)
    {
        $this->relatedTable = $table;

        return $this;
    }

    /**
     * Get the related table name
     *
     * @return string
     */
    public function getRelatedTable()
    {
        return $this->relatedTable;
    }

    /**
     * Set the junction table name
     *
     * @param $table
     *
     * @return ColumnRelationship
     */
    public function setJunctionTable($table)
    {
        $this->junctionTable = $table;

        return $this;
    }

    /**
     * Get the junction table name
     *
     * @return string
     */
    public function getJunctionTable()
    {
        return $this->junctionTable;
    }

    /**
     * Set the junction key left
     *
     * @param $column
     *
     * @return ColumnRelationship
     */
    public function setJunctionKeyLeft($column)
    {
        $this->junctionKeyLeft = $column;

        return $this;
    }

    /**
     * Get the junction key left
     *
     * @return string
     */
    public function getJunctionKeyLeft()
    {
        return $this->junctionKeyLeft;
    }

    /**
     * Set the junction key right
     *
     * @param $column
     *
     * @return ColumnRelationship
     */
    public function setJunctionKeyRight($column)
    {
        $this->junctionKeyRight = $column;

        return $this;
    }

    /**
     * Get the junction key right
     *
     * @return string
     */
    public function getJunctionKeyRight()
    {
        return $this->junctionKeyRight;
    }
}
