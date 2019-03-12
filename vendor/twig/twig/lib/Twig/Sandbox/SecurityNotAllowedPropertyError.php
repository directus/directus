<?php

use Twig\Sandbox\SecurityNotAllowedPropertyError;

class_exists('Twig\Sandbox\SecurityNotAllowedPropertyError');

@trigger_error(sprintf('Using the "Twig_Sandbox_SecurityNotAllowedPropertyError" class is deprecated since Twig version 2.7, use "Twig\Sandbox\SecurityNotAllowedPropertyError" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Sandbox\SecurityNotAllowedPropertyError" instead */
    class Twig_Sandbox_SecurityNotAllowedPropertyError extends SecurityNotAllowedPropertyError
    {
    }
}
