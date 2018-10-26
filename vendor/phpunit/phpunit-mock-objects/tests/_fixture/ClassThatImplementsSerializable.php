<?php
class ClassThatImplementsSerializable implements Serializable
{
    public function serialize()
    {
        return get_object_vars($this);
    }

    public function unserialize($serialized)
    {
        foreach (unserialize($serialized) as $key => $value) {
            $this->{$key} = $value;
        }
    }
}
