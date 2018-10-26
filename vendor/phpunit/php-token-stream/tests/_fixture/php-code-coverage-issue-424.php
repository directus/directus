<?php

class Example
{
    public function even($numbers)
    {
        $numbers = array_filter($numbers, function($number) {
            return $number % 2 === 0;
        });

        return array_merge($numbers);
    }
}