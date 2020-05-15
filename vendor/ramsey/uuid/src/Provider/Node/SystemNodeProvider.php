<?php
/**
 * This file is part of the ramsey/uuid library
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) Ben Ramsey <ben@benramsey.com>
 * @license http://opensource.org/licenses/MIT MIT
 * @link https://benramsey.com/projects/ramsey-uuid/ Documentation
 * @link https://packagist.org/packages/ramsey/uuid Packagist
 * @link https://github.com/ramsey/uuid GitHub
 */

namespace Ramsey\Uuid\Provider\Node;

use Ramsey\Uuid\Provider\NodeProviderInterface;

/**
 * SystemNodeProvider provides functionality to get the system node ID (MAC
 * address) using external system calls
 */
class SystemNodeProvider implements NodeProviderInterface
{
    /**
     * Returns the system node ID
     *
     * @return string|false System node ID as a hexadecimal string, or false if it is not found
     */
    public function getNode()
    {
        static $node = null;

        if ($node !== null) {
            return $node;
        }

        $pattern = '/[^:]([0-9A-Fa-f]{2}([:-])[0-9A-Fa-f]{2}(\2[0-9A-Fa-f]{2}){4})[^:]/';
        $matches = [];

        // first try a  linux specific way
        $node = $this->getSysfs();

        // Search the ifconfig output for all MAC addresses and return
        // the first one found
        if ($node === false) {
            if (preg_match_all($pattern, $this->getIfconfig(), $matches, PREG_PATTERN_ORDER)) {
                $node = $matches[1][0];
            }
        }
        if ($node !== false) {
            $node = str_replace([':', '-'], '', $node);
        }
        return $node;
    }

    /**
     * Returns the network interface configuration for the system
     *
     * @codeCoverageIgnore
     * @return string
     */
    protected function getIfconfig()
    {
        if (strpos(strtolower(ini_get('disable_functions')), 'passthru') !== false) {
            return '';
        }

        ob_start();
        switch (strtoupper(substr(constant('PHP_OS'), 0, 3))) {
            case 'WIN':
                passthru('ipconfig /all 2>&1');
                break;
            case 'DAR':
                passthru('ifconfig 2>&1');
                break;
            case 'FRE':
                passthru('netstat -i -f link 2>&1');
                break;
            case 'LIN':
            default:
                passthru('netstat -ie 2>&1');
                break;
        }

        return ob_get_clean();
    }

    /**
     * Returns mac address from the first system interface via the sysfs interface
     *
     * @return string|bool
     */
    protected function getSysfs()
    {
        $mac = false;

        if (strtoupper(constant('PHP_OS')) === 'LINUX') {
            $addressPaths = glob('/sys/class/net/*/address', GLOB_NOSORT);

            if (empty($addressPaths)) {
                return false;
            }

            $macs = [];
            array_walk($addressPaths, function ($addressPath) use (&$macs) {
                if (is_readable($addressPath)) {
                    $macs[] = file_get_contents($addressPath);
                }
            });

            $macs = array_map('trim', $macs);

            // remove invalid entries
            $macs = array_filter($macs, function ($mac) {
                return
                    // localhost adapter
                    $mac !== '00:00:00:00:00:00' &&
                    // must match  mac adress
                    preg_match('/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i', $mac);
            });

            $mac = reset($macs);
        }

        return $mac;
    }
}
