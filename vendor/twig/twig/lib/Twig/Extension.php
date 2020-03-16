<?php

use Twig\Extension\AbstractExtension;

class_exists('Twig\Extension\AbstractExtension');

@trigger_error(sprintf('Using the "Twig_Extension" class is deprecated since Twig version 2.7, use "Twig\Extension\AbstractExtension" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Extension\AbstractExtension" instead */
    class Twig_Extension extends AbstractExtension
    {
    }
}
