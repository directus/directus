<?php

use Twig\Extension\CoreExtension;

class_exists('Twig\Extension\CoreExtension');

@trigger_error(sprintf('Using the "Twig_Extension_Core" class is deprecated since Twig version 2.7, use "Twig\Extension\CoreExtension" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Extension\CoreExtension" instead */
    class Twig_Extension_Core extends CoreExtension
    {
    }
}
