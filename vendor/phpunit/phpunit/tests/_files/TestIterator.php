<?php
class TestIterator implements Iterator
{
    protected $array;
    protected $position = 0;

    public function __construct($array = [])
    {
        $this->array = $array;
    }

    public function rewind()
    {
        $this->position = 0;
    }

    public function valid()
    {
        return $this->position < count($this->array);
    }

    public function key()
    {
        return $this->position;
    }

    public function current()
    {
        return $this->array[$this->position];
    }

    public function next()
    {
        $this->position++;
    }
}
