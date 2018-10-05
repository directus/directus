<?php
class TestGeneratorMaker
{
    public function create($array = [])
    {
        foreach ($array as $key => $value) {
            yield $key => $value;
        }
    }
}

