<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Command-line options parsing class.
 */
class PHPUnit_Util_Getopt
{
    public static function getopt(array $args, $short_options, $long_options = null)
    {
        if (empty($args)) {
            return [[], []];
        }

        $opts     = [];
        $non_opts = [];

        if ($long_options) {
            sort($long_options);
        }

        if (isset($args[0][0]) && $args[0][0] != '-') {
            array_shift($args);
        }

        reset($args);

        $args = array_map('trim', $args);

        while (false !== $arg = current($args)) {
            $i = key($args);
            next($args);
            if ($arg == '') {
                continue;
            }

            if ($arg == '--') {
                $non_opts = array_merge($non_opts, array_slice($args, $i + 1));

                break;
            }

            if ($arg[0] != '-' || (strlen($arg) > 1 && $arg[1] == '-' && !$long_options)) {
                $non_opts[] = $args[$i];

                continue;
            } elseif (strlen($arg) > 1 && $arg[1] == '-') {
                self::parseLongOption(
                    substr($arg, 2),
                    $long_options,
                    $opts,
                    $args
                );
            } else {
                self::parseShortOption(
                    substr($arg, 1),
                    $short_options,
                    $opts,
                    $args
                );
            }
        }

        return [$opts, $non_opts];
    }

    protected static function parseShortOption($arg, $short_options, &$opts, &$args)
    {
        $argLen = strlen($arg);

        for ($i = 0; $i < $argLen; $i++) {
            $opt     = $arg[$i];
            $opt_arg = null;

            if (($spec = strstr($short_options, $opt)) === false || $arg[$i] == ':') {
                throw new PHPUnit_Framework_Exception(
                    "unrecognized option -- $opt"
                );
            }

            if (strlen($spec) > 1 && $spec[1] == ':') {
                if ($i + 1 < $argLen) {
                    $opts[] = [$opt, substr($arg, $i + 1)];

                    break;
                }
                if (!(strlen($spec) > 2 && $spec[2] == ':')) {
                    if (false === $opt_arg = current($args)) {
                        throw new PHPUnit_Framework_Exception(
                            "option requires an argument -- $opt"
                        );
                    }
                    next($args);
                }
            }

            $opts[] = [$opt, $opt_arg];
        }
    }

    protected static function parseLongOption($arg, $long_options, &$opts, &$args)
    {
        $count   = count($long_options);
        $list    = explode('=', $arg);
        $opt     = $list[0];
        $opt_arg = null;

        if (count($list) > 1) {
            $opt_arg = $list[1];
        }

        $opt_len = strlen($opt);

        for ($i = 0; $i < $count; $i++) {
            $long_opt  = $long_options[$i];
            $opt_start = substr($long_opt, 0, $opt_len);

            if ($opt_start != $opt) {
                continue;
            }

            $opt_rest = substr($long_opt, $opt_len);

            if ($opt_rest != '' && $opt[0] != '=' && $i + 1 < $count &&
                $opt == substr($long_options[$i + 1], 0, $opt_len)) {
                throw new PHPUnit_Framework_Exception(
                    "option --$opt is ambiguous"
                );
            }

            if (substr($long_opt, -1) == '=') {
                if (substr($long_opt, -2) != '==') {
                    if (!strlen($opt_arg)) {
                        if (false === $opt_arg = current($args)) {
                            throw new PHPUnit_Framework_Exception(
                                "option --$opt requires an argument"
                            );
                        }
                        next($args);
                    }
                }
            } elseif ($opt_arg) {
                throw new PHPUnit_Framework_Exception(
                    "option --$opt doesn't allow an argument"
                );
            }

            $full_option = '--' . preg_replace('/={1,2}$/', '', $long_opt);
            $opts[]      = [$full_option, $opt_arg];

            return;
        }

        throw new PHPUnit_Framework_Exception("unrecognized option --$opt");
    }
}

