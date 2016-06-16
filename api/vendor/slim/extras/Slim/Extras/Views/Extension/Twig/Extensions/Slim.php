<?php

class Twig_Extensions_Slim extends \Twig_Extension
{
    public function getName()
    {
        return 'slim';
    }

    public function getFunctions()
    {
        return array(
            'urlFor' => new \Twig_Function_Method($this, 'urlFor'),
        );
    }

    public function urlFor($name, $params = array(), $appName = 'default')
    {
        return \Slim\Slim::getInstance($appName)->urlFor($name, $params);
    }
}
