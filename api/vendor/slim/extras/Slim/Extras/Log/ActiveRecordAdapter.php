<?php

/**
 * ActiveRecord Adapter for Log File Writer
 *
 * Use for PHP ActiveRecord logging via Slim logger.
 * http://www.phpactiverecord.org/
 *
 * USAGE
 *
 * $app = new \Slim\Slim(array(
 *     'log.writer' => new \Slim\Extras\Log\DateTimeFileWriter()
 * ));
 *
 * $connections = array(
 *    "development" => "mysql://example:example@mysql.example.com/example_slim;charset=utf8",
 *    "production"  => "mysql://example:example@localhost/example_slim;charset=utf8"
 * );
 *
 * ActiveRecord\Config::initialize(function($cfg) use ($connections, $app) {
 *    $cfg->set_connections($connections);
 *    $cfg->set_logging(true);
 *    $cfg->set_logger(new \Slim\Extras\Log\ActiveRecordAdapter($app->getLog(), \Slim\Log::DEBUG));
 * });
 *
 * @author Mika Tuupola <tuupola@appelsiini.net>
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

namespace Slim\Extras\Log;

class ActiveRecordAdapter {

    private $logger;
    private $level;
    
    function __construct($logger, $level = \Slim\Log::DEBUG) {
        $this->logger = $logger;
        $this->level = $level;
    }
    
    public function log($message) {
        /* $this->logger->log($message, $this->level); */

        /* \Slim\Log::log() is protected so have to do this the hard way. */
        switch($this->level) {
            case \Slim\Log::FATAL:
              $this->logger->fatal($message);
              break;
            case \Slim\Log::ERROR:
              $this->logger->error($message);
              break;
            case \Slim\Log::WARN:
              $this->logger->warn($message);
              break;
            case \Slim\Log::INFO:
              $this->logger->info($message);
              break;
            case \Slim\Log::DEBUG:
              $this->logger->debug($message);
              break;
        }
    }

}
