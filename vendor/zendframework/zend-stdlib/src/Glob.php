<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

/**
 * Wrapper for glob with fallback if GLOB_BRACE is not available.
 */
abstract class Glob
{
    /**#@+
     * Glob constants.
     */
    const GLOB_MARK     = 0x01;
    const GLOB_NOSORT   = 0x02;
    const GLOB_NOCHECK  = 0x04;
    const GLOB_NOESCAPE = 0x08;
    const GLOB_BRACE    = 0x10;
    const GLOB_ONLYDIR  = 0x20;
    const GLOB_ERR      = 0x40;
    /**#@-*/

    /**
     * Find pathnames matching a pattern.
     *
     * @see    http://docs.php.net/glob
     * @param  string  $pattern
     * @param  int $flags
     * @param  bool $forceFallback
     * @return array
     * @throws Exception\RuntimeException
     */
    public static function glob($pattern, $flags = 0, $forceFallback = false)
    {
        if (!defined('GLOB_BRACE') || $forceFallback) {
            return static::fallbackGlob($pattern, $flags);
        }

        return static::systemGlob($pattern, $flags);
    }

    /**
     * Use the glob function provided by the system.
     *
     * @param  string  $pattern
     * @param  int     $flags
     * @return array
     * @throws Exception\RuntimeException
     */
    protected static function systemGlob($pattern, $flags)
    {
        if ($flags) {
            $flagMap = [
                self::GLOB_MARK     => GLOB_MARK,
                self::GLOB_NOSORT   => GLOB_NOSORT,
                self::GLOB_NOCHECK  => GLOB_NOCHECK,
                self::GLOB_NOESCAPE => GLOB_NOESCAPE,
                self::GLOB_BRACE    => defined('GLOB_BRACE') ? GLOB_BRACE : 0,
                self::GLOB_ONLYDIR  => GLOB_ONLYDIR,
                self::GLOB_ERR      => GLOB_ERR,
            ];

            $globFlags = 0;

            foreach ($flagMap as $internalFlag => $globFlag) {
                if ($flags & $internalFlag) {
                    $globFlags |= $globFlag;
                }
            }
        } else {
            $globFlags = 0;
        }

        ErrorHandler::start();
        $res = glob($pattern, $globFlags);
        $err = ErrorHandler::stop();
        if ($res === false) {
            throw new Exception\RuntimeException("glob('{$pattern}', {$globFlags}) failed", 0, $err);
        }
        return $res;
    }

    /**
     * Expand braces manually, then use the system glob.
     *
     * @param  string  $pattern
     * @param  int     $flags
     * @return array
     * @throws Exception\RuntimeException
     */
    protected static function fallbackGlob($pattern, $flags)
    {
        if (!$flags & self::GLOB_BRACE) {
            return static::systemGlob($pattern, $flags);
        }

        $flags &= ~self::GLOB_BRACE;
        $length = strlen($pattern);
        $paths  = [];

        if ($flags & self::GLOB_NOESCAPE) {
            $begin = strpos($pattern, '{');
        } else {
            $begin = 0;

            while (true) {
                if ($begin === $length) {
                    $begin = false;
                    break;
                } elseif ($pattern[$begin] === '\\' && ($begin + 1) < $length) {
                    $begin++;
                } elseif ($pattern[$begin] === '{') {
                    break;
                }

                $begin++;
            }
        }

        if ($begin === false) {
            return static::systemGlob($pattern, $flags);
        }

        $next = static::nextBraceSub($pattern, $begin + 1, $flags);

        if ($next === null) {
            return static::systemGlob($pattern, $flags);
        }

        $rest = $next;

        while ($pattern[$rest] !== '}') {
            $rest = static::nextBraceSub($pattern, $rest + 1, $flags);

            if ($rest === null) {
                return static::systemGlob($pattern, $flags);
            }
        }

        $p = $begin + 1;

        while (true) {
            $subPattern = substr($pattern, 0, $begin)
                        . substr($pattern, $p, $next - $p)
                        . substr($pattern, $rest + 1);

            $result = static::fallbackGlob($subPattern, $flags | self::GLOB_BRACE);

            if ($result) {
                $paths = array_merge($paths, $result);
            }

            if ($pattern[$next] === '}') {
                break;
            }

            $p    = $next + 1;
            $next = static::nextBraceSub($pattern, $p, $flags);
        }

        return array_unique($paths);
    }

    /**
     * Find the end of the sub-pattern in a brace expression.
     *
     * @param  string  $pattern
     * @param  int $begin
     * @param  int $flags
     * @return int|null
     */
    protected static function nextBraceSub($pattern, $begin, $flags)
    {
        $length  = strlen($pattern);
        $depth   = 0;
        $current = $begin;

        while ($current < $length) {
            if (!$flags & self::GLOB_NOESCAPE && $pattern[$current] === '\\') {
                if (++$current === $length) {
                    break;
                }

                $current++;
            } else {
                if (($pattern[$current] === '}' && $depth-- === 0) || ($pattern[$current] === ',' && $depth === 0)) {
                    break;
                } elseif ($pattern[$current++] === '{') {
                    $depth++;
                }
            }
        }

        return ($current < $length ? $current : null);
    }
}
