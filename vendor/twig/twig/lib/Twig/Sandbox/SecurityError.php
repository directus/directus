<?php

use Twig\Sandbox\SecurityError;

class_exists('Twig\Sandbox\SecurityError');

@trigger_error(sprintf('Using the "Twig_Sandbox_SecurityError" class is deprecated since Twig version 2.7, use "Twig\Sandbox\SecurityError" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Sandbox\SecurityError" instead */
    class Twig_Sandbox_SecurityError extends SecurityError
    {
    }
}
