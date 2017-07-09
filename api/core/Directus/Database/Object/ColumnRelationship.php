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
use Directus\Util\Traits\ArrayPropertyAccess;
use Directus\Util\Traits\ArrayPropertyToArray;
use Directus\Util\Traits\ArraySetter;

/**
 * Column relationship
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class ColumnRelationship implements \ArrayAccess, Arrayable, \JsonSerializable
{
    use ArraySetter, ArrayPropertyAccess, ArrayPropertyToArray;

    const ONE_TO_MANY = 'ONETOMANY';
    const MANY_TO_MANY = 'MANYTOMANY';
    const MANY_TO_ONE = 'MANYTOONE';

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
     * @var array
     */
    protected $avoidSerializing = [
        'writableProperty',
        'readableProperty'
    ];

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
            'junction_key_left',
            'junction_key_right'
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

    /**
     * Checks whether the relatiopship is MANY TO ONE
     *
     * @return bool
     */
    public function isManyToOne()
    {
        return $this->getType() === static::MANY_TO_ONE;
    }

    /**
     * Checks whether the relatiopship is MANY TO MANY
     *
     * @return bool
     */
    public function isManyToMany()
    {
        return $this->getType() === static::MANY_TO_MANY;
    }

    /**
     * Checks whether the relatiopship is ONE TO MANY
     *
     * @return bool
     */
    public function isOneToMany()
    {
        return $this->getType() === static::ONE_TO_MANY;
    }

    /**
     * Gets an Array representation
     *
     * @return array
     */
    public function toArray()
    {
        return $this->propertyArray();
    }

    /**
     * @inheritDoc
     */
    function jsonSerialize()
    {
        return $this->toArray();
    }
}
