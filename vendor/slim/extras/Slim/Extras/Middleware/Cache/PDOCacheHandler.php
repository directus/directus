<?php
/**
 * Example Cache Handler
 *
 * This example implementation uses a PDO connection to a MySQL database and
 * the table structure included in cache.sql. You can write your own handler
 * by implementing the ICacheHandler interface.
 *
 * @author Timothy Boronczyk
 * @version 1.0
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Extras\Middleware\Cache;

class PDOCacheHandler implements ICacheHandler
{
    protected $db;
    protected $ttl;

    public function __construct(\PDO $db, $ttl = 300)
    {
        $this->db = $db;
        $this->ttl = $ttl;
    }

    public function fetch($key)
    {
        $query = sprintf(
            'SELECT `content_type`, `body` FROM `cache` 
            WHERE `key` = %s AND `tstamp` > %d',
            $this->db->quote(md5($key)),
            time() - $this->ttl
        );
        $result = $this->db->query($query);
        $row = $result->fetch(\PDO::FETCH_ASSOC);
        $result->closeCursor();
        return $row;
    }

    public function save($key, $contentType, $body)
    {
        $query = sprintf(
            'INSERT INTO `cache` (`key`, `content_type`, `body`, `tstamp`)
            VALUES (%s, %s, %s, %d)
            ON DUPLICATE KEY UPDATE
            `content_type` = %2$s, `body` = %3$s, `tstamp` = %4$d',
            $this->db->quote(md5($key)),
            $this->db->quote($contentType),
            $this->db->quote($body),
            time()
        );
        $this->db->query($query);
    }
}
