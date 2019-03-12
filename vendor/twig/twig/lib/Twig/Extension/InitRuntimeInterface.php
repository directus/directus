<?php

use Twig\Extension\InitRuntimeInterface;

class_exists('Twig\Extension\InitRuntimeInterface');

@trigger_error(sprintf('Using the "Twig_Extension_InitRuntimeInterface" class is deprecated since Twig version 2.7, use "Twig\Extension\InitRuntimeInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Extension\InitRuntimeInterface" instead */
    class Twig_Extension_InitRuntimeInterface extends InitRuntimeInterface
    {
    }
}
