<?php

namespace Directus\Util\Traits;

use Directus\Util\StringUtils;

/**
 * Array Setter trait
 *
 * Using this trait will allow a class to set their data using an array
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
trait ArraySetter
{
    /**
     * Set the table attributes
     *
     * @param array $attributes
     *
     * @return $this
     */
    public function setData(array $attributes)
    {
        foreach($attributes as $attribute => $value) {
            $method = 'set' .  StringUtils::underscoreToCamelCase($attribute, true);
            if (method_exists($this, $method)) {
                call_user_func_array([$this, $method], [$value]);
            }
        }

        return $this;
    }
}
