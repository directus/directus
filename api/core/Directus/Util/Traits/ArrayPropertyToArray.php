<?php

namespace Directus\Util\Traits;

trait ArrayPropertyToArray
{
    public function propertyArray()
    {
        $output = [];
        $properties = get_object_vars($this);

        foreach($properties as $property => $value) {
            $avoidProperty = property_exists($this, 'avoidSerializing') && in_array($property, $this->avoidSerializing);
            if ($property === 'avoidSerializing' || $avoidProperty) {
                continue;
            }

            $key = ltrim(strtolower(preg_replace('/[A-Z]/', '_$0', $property)), '_');
            $output[$key] = is_object($value) && method_exists($value, 'toArray') ? $value->toArray() : $value;
        }

        return $output;
    }
}