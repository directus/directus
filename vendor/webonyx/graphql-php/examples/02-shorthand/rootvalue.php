<?php

interface Resolver {
    public function resolve($root, $args, $context);
}

class Addition implements Resolver
{
    public function resolve($root, $args, $context)
    {
        return $args['x'] + $args['y'];
    }
}

class Echoer implements Resolver
{
    public function resolve($root, $args, $context)
    {
        return $root['prefix'].$args['message'];
    }
}

return [
    'sum' => function($root, $args, $context) {
        $sum = new Addition();

        return $sum->resolve($root, $args, $context);
    },
    'echo' => function($root, $args, $context) {
        $echo = new Echoer();

        return $echo->resolve($root, $args, $context);
    },
    'prefix' => 'You said: ',
];
