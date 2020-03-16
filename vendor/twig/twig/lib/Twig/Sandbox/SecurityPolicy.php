<?php

use Twig\Sandbox\SecurityPolicy;

class_exists('Twig\Sandbox\SecurityPolicy');

@trigger_error(sprintf('Using the "Twig_Sandbox_SecurityPolicy" class is deprecated since Twig version 2.7, use "Twig\Sandbox\SecurityPolicy" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Sandbox\SecurityPolicy" instead */
    class Twig_Sandbox_SecurityPolicy extends SecurityPolicy
    {
    }
}
