<?php

use Twig\ExtensionSet;

class_exists('Twig\ExtensionSet');

@trigger_error(sprintf('Using the "Twig_ExtensionSet" class is deprecated since Twig version 2.7, use "Twig\ExtensionSet" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\ExtensionSet" instead */
    class Twig_ExtensionSet extends ExtensionSet
    {
    }
}
