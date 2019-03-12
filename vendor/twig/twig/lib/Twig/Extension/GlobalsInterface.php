<?php

use Twig\Extension\GlobalsInterface;

class_exists('Twig\Extension\GlobalsInterface');

@trigger_error(sprintf('Using the "Twig_Extension_GlobalsInterface" class is deprecated since Twig version 2.7, use "Twig\Extension\GlobalsInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Extension\GlobalsInterface" instead */
    class Twig_Extension_GlobalsInterface extends GlobalsInterface
    {
    }
}
