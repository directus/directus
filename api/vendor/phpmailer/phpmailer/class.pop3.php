<?php
/**
 * PHPMailer POP-Before-SMTP Authentication Class.
 * PHP Version 5
 * @package PHPMailer
 * @link https://github.com/PHPMailer/PHPMailer/
 * @author Marcus Bointon (Synchro/coolbru) <phpmailer@synchromedia.co.uk>
 * @author Jim Jagielski (jimjag) <jimjag@gmail.com>
 * @author Andy Prevost (codeworxtech) <codeworxtech@users.sourceforge.net>
 * @author Brent R. Matzelle (original founder)
 * @copyright 2012 - 2014 Marcus Bointon
 * @copyright 2010 - 2012 Jim Jagielski
 * @copyright 2004 - 2009 Andy Prevost
 * @license http://www.gnu.org/copyleft/lesser.html GNU Lesser General Public License
 * @note This program is distributed in the hope that it will be useful - WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.
 */

/**
 * PHPMailer POP-Before-SMTP Authentication Class.
 * Specifically for PHPMailer to use for RFC1939 POP-before-SMTP authentication.
 * Does not support APOP.
 * @package PHPMailer
 * @author Richard Davey (original author) <rich@corephp.co.uk>
 * @author Marcus Bointon (Synchro/coolbru) <phpmailer@synchromedia.co.uk>
 * @author Jim Jagielski (jimjag) <jimjag@gmail.com>
 * @author Andy Prevost (codeworxtech) <codeworxtech@users.sourceforge.net>
 */
class POP3
{
    /**
     * The POP3 PHPMailer Version number.
     * @var string
     * @access public
     */
    public $Version = '5.2.14';

    /**
     * Default POP3 port number.
     * @var integer
     * @access public
     */
    public $POP3_PORT = 110;

    /**
     * Default timeout in seconds.
     * @var integer
     * @access public
     */
    public $POP3_TIMEOUT = 30;

    /**
     * POP3 Carriage Return + Line Feed.
     * @var string
     * @access public
     * @deprecated Use the constant instead
     */
    public $CRLF = "\r\n";

    /**
     * Debug display level.
     * Options: 0 = no, 1+ = yes
     * @var integer
     * @access public
     */
    public $do_debug = 0;

    /**
     * POP3 mail server hostname.
     * @var string
     * @access public
     */
    public $host;

    /**
     * POP3 port number.
     * @var integer
     * @access public
     */
    public $port;

    /**
     * POP3 Timeout Value in seconds.
     * @var integer
     * @access public
     */
    public $tval;

    /**
     * POP3 username
     * @var string
     * @access public
     */
    public $username;

    /**
     * POP3 password.
     * @var string
     * @access public
     */
    public $password;

    /**
     * Resource handle for the POP3 connection socket.
     * @var resource
     * @access protected
     */
    protected $pop_conn;

    /**
     * Are we connected?
     * @var boolean
     * @access protected
     */
    protected $connected = false;

    /**
     * Error container.
     * @var array
     * @access protected
     */
    protected $errors = array();

    /**
     * Line break constant
     */
    const CRLF = "\r\n";

    /**
     * Simple static wrapper for all-in-one POP before SMTP
     * @param $host
     * @param integer|boolean $port The port number to connect to
     * @param integer|boolean $timeout The timeout value
     * @param string $username
     * @param string $password
     * @param integer $debug_level
     * @return boolean
     */
    public static function popBeforeSmtp(
        $host,
        $port = false,
        $timeout = false,
        $username = '',
        $password = '',
        $debug_level = 0
    ) {
        $pop = new POP3;
        return $pop->authorise($host, $port, $timeout, $username, $password, $debug_level);
    }

    /**
     * Authenticate with a POP3 server.
     * A connect, login, disconnect sequence
     * appropriate for POP-before SMTP authorisation.
     * @access public
     * @param string $host The hostname to connect to
     * @param integer|boolean $port The port number to connect to
     * @param integer|boolean $timeout The timeout value
     * @param string $username
     * @param string $password
     * @param integer $debug_level
     * @return boolean
     */
    public function authorise($host, $port = false, $timeout = false, $username = '', $password = '', $debug_level = 0)
    {
        $this->host = $host;
        // If no port value provided, use default
        if (false === $port) {
            $this->port = $this->POP3_PORT;
        } else {
            $this->port = (integer)$port;
        }
        // If no timeout value provided, use default
        if (false === $timeout) {
            $this->tval = $this->POP3_TIMEOUT;
        } else {
            $this->tval = (integer)$timeout;
        }
        $this->do_debug = $debug_level;
        $this->username = $username;
        $this->password = $password;
        //  Reset the error log
        $this->errors = array();
        //  connect
        $result = $this->connect($this->host, $this->port, $this->tval);
        if ($result) {
            $login_result = $this->login($this->username, $this->password);
            if ($login_result) {
                $this->disconnect();
                return true;
            }
        }
        // We need to disconnect regardless of whether the login succeeded
        $this->disconnect();
        return false;
    }

    /**
     * Connect to a POP3 server.
     * @access public
     * @param string $host
     * @param integer|boolean $port
     * @param integer $tval
     * @return boolean
     */
    public function connect($host, $port = false, $tval = 30)
    {
        //  Are we already connected?
        if ($this->connected) {
            return true;
        }

        //On Windows this will raise a PHP Warning error if the hostname doesn't exist.
        //Rather than suppress it with @fsockopen, capture it cleanly instead
        set_error_handler(array($this, 'catchWarning'));

        if (false === $port) {
            $port = $this->POP3_PORT;
        }

        //  connect to the POP3 server
        $this->pop_conn = fsockopen(
            $host, //  POP3 Host
            $port, //  Port #
            $errno, //  Error Number
            $errstr, //  Error Message
            $tval
        ); //  Timeout (seconds)
        //  Restore the error handler
        restore_error_handler();

        //  Did we connect?
        if (false === $this->pop_conn) {
            //  It would appear not...
            $this->setError(array(
                'error' => "Failed to connect to server $host on port $port",
                'errno' => $errno,
                'errstr' => $errstr
            ));
            return false;
        }

        //  Increase the stream time-out
        stream_set_timeout($this->pop_conn, $tval, 0);

        //  Get the POP3 server response
        $pop3_response = $this->getResponse();
        //  Check for the +OK
        if ($this->checkResponse($pop3_response)) {
            //  The connection is established and the POP3 server is talking
            $this->connected = true;
            return true;
        }
        return false;
    }

    /**
     * Log in to the POP3 server.
     * Does not support APOP (RFC 2828, 4949).
     * @access public
     * @param string $username
     * @param string $password
     * @return boolean
     */
    public function login($username = '', $password = '')
    {
        if (!$this->connected) {
            $this->setError('Not connected to POP3 server');
        }
        if (empty($username)) {
            $username = $this->username;
        }
        if (empty($password)) {
            $password = $this->password;
        }

        // Send the Username
        $this->sendString("USER $username" . self::CRLF);
        $pop3_response = $this->getResponse();
        if ($this->checkResponse($pop3_response)) {
            // Send the Password
            $this->sendString("PASS $password" . self::CRLF);
            $pop3_response = $this->getResponse();
            if ($this->checkResponse($pop3_response)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Disconnect from the POP3 server.
     * @access public
     */
    public function disconnect()
    {
        $this->sendString('QUIT');
        //The QUIT command may cause the daemon to exit, which will kill our connection
        //So ignore errors here
        try {
            @fclose($this->pop_conn);
        } catch (Exception $e) {
            //Do nothing
        };
    }

    /**
     * Get a response from the POP3 server.
     * $size is the maximum number of bytes to retrieve
     * @param integer $size
     * @return string
     * @access protected
     */
    protected function getResponse($size = 128)
    {
        $response = fgets($this->pop_conn, $size);
        if ($this->do_debug >= 1) {
            echo "Server -> Client: $response";
        }
        return $response;
    }

    /**
     * Send raw data to the POP3 server.
     * @param string $string
     * @return integer
     * @access protected
     */
    protected function sendString($string)
    {
        if ($this->pop_conn) {
            if ($this->do_debug >= 2) { //Show client messages when debug >= 2
                echo "Client -> Server: $string";
            }
            return fwrite($this->pop_conn, $string, strlen($string));
        }
        return 0;
    }

    /**
     * Checks the POP3 server response.
     * Looks for for +OK or -ERR.
     * @param string $string
     * @return boolean
     * @access protected
     */
    protected function checkResponse($string)
    {
        if (substr($string, 0, 3) !== '+OK') {
            $this->setError(array(
                'error' => "Server reported an error: $string",
                'errno' => 0,
                'errstr' => ''
            ));
            return false;
        } else {
            return true;
        }
    }

    /**
     * Add an error to the internal error store.
     * Also display debug output if it's enabled.
     * @param $error
     * @access protected
     */
    protected function setError($error)
    {
        $this->errors[] = $error;
        if ($this->do_debug >= 1) {
            echo '<pre>';
            foreach ($this->errors as $error) {
                print_r($error);
            }
            echo '</pre>';
        }
    }

    /**
     * Get an array of error messages, if any.
     * @return array
     */
    public function getErrors()
    {
        return $this->errors;
    }

    /**
     * POP3 connection error handler.
     * @param integer $errno
     * @param string $errstr
     * @param string $errfile
     * @param integer $errline
     * @access protected
     */
    protected function catchWarning($errno, $errstr, $errfile, $errline)
    {
        $this->setError(array(
            'error' => "Connecting to the POP3 server raised a PHP warning: ",
            'errno' => $errno,
            'errstr' => $errstr,
            'errfile' => $errfile,
            'errline' => $errline
        ));
    }
}
