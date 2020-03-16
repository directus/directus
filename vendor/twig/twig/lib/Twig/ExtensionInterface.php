<?php

use Twig\Extension\ExtensionInterface;

class_exists('Twig\Extension\ExtensionInterface');

@trigger_error(sprintf('Using the "Twig_ExtensionInterface" class is deprecated since Twig version 2.7, use "Twig\Extension\ExtensionInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Extension\ExtensionInterface" instead */
    class Twig_ExtensionInterface extends ExtensionInterface
    {
    }
}
