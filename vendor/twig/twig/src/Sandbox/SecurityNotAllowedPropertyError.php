<?php

namespace Twig\Sandbox;

class_exists('Twig_Sandbox_SecurityNotAllowedPropertyError');

if (\false) {
    class SecurityNotAllowedPropertyError extends \Twig_Sandbox_SecurityNotAllowedPropertyError
    {
    }
}
