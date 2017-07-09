<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use Directus\Util\ArrayUtils;

/**
 * Authentication User
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class User implements UserInterface
{
    /**
     * User information
     *
     * @var array
     */
    protected $attributes = [];

    public function __construct(array $attributes)
    {
        $this->attributes = $attributes;
    }

    /**
     * Gets the attribute with the given name
     *
     * @param $name
     *
     * @return mixed
     */
    public function get($name)
    {
        return ArrayUtils::get($this->attributes, $name);
    }

    /**
     * @inheritdoc
     */
    public function getId()
    {
        return $this->get('id');
    }

    /**
     * @inheritdoc
     */
    public function getEmail()
    {
        return $this->get('email');
    }
}
