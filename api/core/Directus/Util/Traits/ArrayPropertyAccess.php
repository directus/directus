<?php

namespace Directus\Util\Traits;

use Directus\Util\StringUtils;

trait ArrayPropertyAccess
{
    protected function getPropertyFromArrayKey($key)
    {
        $readable = ['*'];
        if (property_exists($this, 'readableProperty')) {
            $readable = $this->readableProperty;
        }

        if (in_array($key, $readable) || in_array('*', $readable)) {
            return StringUtils::underscoreToCamelCase($key);
        }

        $format = 'Cannot access or does not exists key [%s] in %s';
        throw new \Exception(sprintf($format, $key, __CLASS__));
    }

    /**
     * @param mixed $offset
     *
     * @return bool
     */
    public function offsetExists($offset)
    {
        try {
            return property_exists($this, $this->getPropertyFromArrayKey($offset));
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * @param mixed $offset
     *
     * @return mixed
     */
    public function offsetGet($offset)
    {
        $propertyName = $this->getPropertyFromArrayKey($offset);

        return property_exists($this, $propertyName) ? $this->{$propertyName} : null;
    }

    /**
     * @param mixed $offset
     * @param mixed $value
     *
     * @return mixed
     */
    public function offsetSet($offset, $value)
    {
        $propertyName = $this->getPropertyFromArrayKey($offset);

        if (property_exists($this, $propertyName)) {
            $this->{$propertyName} = $value;
        }

        return $this->{$propertyName};
    }

    /**
     * @param mixed $offset
     *
     * @return mixed
     */
    public function offsetUnset($offset)
    {
        $propertyName = $this->getPropertyFromArrayKey($offset);
        $value = null;
        if (property_exists($this, $propertyName)) {
            $value = $this->{$propertyName};
            $this->{$propertyName} = null;
        }

        return $value;
    }
}
