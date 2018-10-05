<?php
/*
 * This file is part of the GlobalState package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\GlobalState;

/**
 * Exports parts of a Snapshot as PHP code.
 */
class CodeExporter
{
    /**
     * @param  Snapshot $snapshot
     * @return string
     */
    public function constants(Snapshot $snapshot)
    {
        $result = '';

        foreach ($snapshot->constants() as $name => $value) {
            $result .= sprintf(
                'if (!defined(\'%s\')) define(\'%s\', %s);' . "\n",
                $name,
                $name,
                $this->exportVariable($value)
            );
        }

        return $result;
    }

    /**
     * @param  Snapshot $snapshot
     * @return string
     */
    public function iniSettings(Snapshot $snapshot)
    {
        $result = '';

        foreach ($snapshot->iniSettings() as $key => $value) {
            $result .= sprintf(
                '@ini_set(%s, %s);' . "\n",
                $this->exportVariable($key),
                $this->exportVariable($value)
            );
        }

        return $result;
    }

    /**
     * @param  mixed  $variable
     * @return string
     */
    private function exportVariable($variable)
    {
        if (is_scalar($variable) || is_null($variable) ||
            (is_array($variable) && $this->arrayOnlyContainsScalars($variable))) {
            return var_export($variable, true);
        }

        return 'unserialize(' . var_export(serialize($variable), true) . ')';
    }

    /**
     * @param  array $array
     * @return bool
     */
    private function arrayOnlyContainsScalars(array $array)
    {
        $result = true;

        foreach ($array as $element) {
            if (is_array($element)) {
                $result = self::arrayOnlyContainsScalars($element);
            } elseif (!is_scalar($element) && !is_null($element)) {
                $result = false;
            }

            if ($result === false) {
                break;
            }
        }

        return $result;
    }
}
