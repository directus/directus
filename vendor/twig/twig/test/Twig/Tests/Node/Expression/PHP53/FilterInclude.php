<?php

$env = new Twig_Environment(new Twig_Loader_Array(array()));
$env->addFilter(new Twig_SimpleFilter('anonymous', function () {}));

return $env;
