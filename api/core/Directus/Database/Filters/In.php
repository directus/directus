<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Filters;

class In implements Filter
{
    /**
     * @var string
     */
    protected $identifier;

    /**
     * @var array
     */
    protected $values;

    /**
     * @var bool
     */
    protected $not;

    /**
     * @var string
     */
    protected $logic;

    public function __construct($identifier, array $values, $not = false, $logic = 'and')
    {
        $this->identifier = $identifier;
        $this->values = $values;
        $this->not = $not;
        $this->logic = $logic;
    }

    /**
     * @return string
     */
    public function getIdentifier()
    {
        return $this->identifier;
    }

    /**
     * @return array
     */
    public function getValue()
    {
        $operator = ($this->not ? 'not' : '') . 'in';

        return [
            $operator => $this->values,
            'logical' => $this->logic
        ];
    }

    /**
     * @return array
     */
    public function toArray()
    {
        return [
            $this->getIdentifier() => $this->getValue()
        ];
    }
}
