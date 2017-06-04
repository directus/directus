<?php

namespace Directus\Application;

use Slim\Http\Request;
use Slim\Http\Util;

class BaseRequest extends Request
{
    public function post($key = null, $default = null)
    {
        if (!isset($this->env['slim.input'])) {
            throw new \RuntimeException('Missing slim.input in environment variables');
        }

        if (!isset($this->env['slim.request.form_hash'])) {
            $this->env['slim.request.form_hash'] = array();
            if ($this->isFormData() && is_string($this->env['slim.input'])) {
                $output = array();
                if (function_exists('mb_parse_str') && !isset($this->env['slim.tests.ignore_multibyte'])) {
                    mb_parse_str($this->env['slim.input'], $output);
                } else {
                    parse_str($this->env['slim.input'], $output);
                }
                $this->env['slim.request.form_hash'] = Util::stripSlashesIfMagicQuotes($output);
            } else if ($this->getMediaType() == 'application/json') {
                // @NOTE: Slim request do not parse a json request body
                //        We need to parse it ourselves
                $jsonRequest = json_decode($this->env['slim.input'], true);
                $this->env['slim.request.form_hash'] = Util::stripSlashesIfMagicQuotes($jsonRequest);
            } else {
                $this->env['slim.request.form_hash'] = Util::stripSlashesIfMagicQuotes($_POST);
            }
        }

        if ($key) {
            if (isset($this->env['slim.request.form_hash'][$key])) {
                return $this->env['slim.request.form_hash'][$key];
            } else {
                return $default;
            }
        } else {
            return $this->env['slim.request.form_hash'];
        }
    }
}
