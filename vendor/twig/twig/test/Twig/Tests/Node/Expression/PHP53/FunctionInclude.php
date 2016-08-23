<?php

$env = new Twig_Environment(new Twig_Loader_Array(array()));
$env->addFunction(new Twig_SimpleFunction('anonymous', function () {}));

return $env;
