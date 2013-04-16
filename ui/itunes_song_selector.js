<?php

/**
 * Initialize Directus Engine
 */

// Application & DB config
//require '../api/config.php';
// Non-autoload components
//require '../api/core/db.php';
// Directus dependencies, Composer Autoloader
require '../api/vendor/autoload.php';

// Directus Autoloader
use Symfony\Component\ClassLoader\UniversalClassLoader;
$loader = new UniversalClassLoader();
$loader->registerNamespace("Directus", dirname(__FILE__) . "/../directus/api/core/");
$loader->register();

use Directus\Bootstrap;
use Directus\Db\TableGateway\RelationalTableGateway as TableGateway;
use Zend\Db\Sql\Select;

//include_once('order.php');

$uriWithoutQueryString = trim(str_replace($_SERVER['QUERY_STRING'], '', $_SERVER['REQUEST_URI']), '?');

$request = explode('/', substr($uriWithoutQueryString, 1));
foreach($request as $k => $v)
    if(!$v) unset($request[$k]);
$request = array_values($request);


class cashRegister {

    function __construct($ZendDb, $olddb, $aclProvider) {
      $this->ZendDb = $ZendDb;
      $this->db = $olddb;
      $this->aclProvider = $aclProvider;
    }

    protected function makeGateway($tableName) {
        $TableGateway = new TableGateway($this->aclProvider, $tableName, $this->ZendDb);
        return $TableGateway;
    }

    function products($searchVal = "") {
        $ProductsGateway = $this->makeGateway('products');
        if ($searchVal != "") {
            $searchVal = urldecode($searchVal);
            $select = new Select("products");
            $select->where->like('title', "%$searchVal%");
            $results = $ProductsGateway->selectWith($select);
        } else {
            $results = $ProductsGateway->fetchAll();
        }
        // If you want arrays
        $resultsRet = array();
        foreach ($results as $row)
            array_push($resultsRet, $row->toArray());
        return $resultsRet;
    }

    function transaction_comp_reasons() {
        $CompReasonsGateway = $this->makeGateway('transaction_comp_reasons');
        $results = $CompReasonsGateway->fetchAll();
        // If you want arrays
        $resultsRet = array();
        foreach ($results as $row)
            array_push($resultsRet, $row->toArray());
        return $resultsRet;
    }

    function customers($searchVal = "") {
        if ($searchVal == "class") {
            // TODO: room_id needs to be a room in the selected studio...
            // get class start and end time based on class_type_id...
            $query = "SELECT rid.* from riders rid ";
            $query .= "JOIN reservations res ";
            $query .= "ON res.user_id = rid.id ";
            $query .= "JOIN classes cla ";
            $query .= "ON res.class_id = cla.id ";
            $query .= "WHERE cla.datetime < DATE_ADD(NOW(), INTERVAL 1 HOUR) AND cla.datetime >= NOW()";
        } else if ($searchVal != "") {
            $searchVal = urldecode($searchVal);
            $searchArray = explode(" ", $searchVal);
            $query="SELECT * FROM riders WHERE  MATCH (`first_name`, `last_name`, `email`) AGAINST ('";
            $i=0;
            foreach ($searchArray as $word) {
                $query .= "+".$word."* ";
            }
            $query .= "' IN BOOLEAN MODE)";
        } else {
            $query = "SELECT * FROM riders";
        }
        $stmt = $this->db->dbh->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        //$results['query'] = $query;
        return $results;
    }

    function omnibox($searchVal = "") {
        if ($searchVal != "") {

        } else {
            $query = "SELECT id, title, 'product' AS `type` FROM products ";
            $query .= "UNION ";
            $query .= "SELECT id, CONCAT(last_name, ', ', first_name,  ' (', email, ')') `title`, 'rider' AS `type` FROM riders";
        }
        $stmt = $this->db->dbh->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $results;
    }

    function payment_types() {
        $query = "SELECT * FROM payment_types";
        $stmt = $this->db->dbh->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $results;
    }

    function order() {
        $data = json_decode(file_get_contents('php://input'), true);




        $insertData['studio_id'] = 0;
        $insertData['rider_id'] = $data['selectedRider']['id'];
        $insertData['order_total'] = $data['order_total'];
        $insertData['first_name'] = $data['selectedRider']['first_name'];
        $insertData['last_name'] = $data['selectedRider']['last_name'];
        $insertData['address_1'] = $data['selectedRider']['address_1'];
        $insertData['address_2'] = $data['selectedRider']['address_2'];
        $insertData['city'] = $data['selectedRider']['city'];
        $insertData['state'] = $data['selectedRider']['state'];
        $insertData['zip'] = $data['selectedRider']['zip'];
        

        $OrderGateway = $this->makeGateway('orders');
        $newOrder = $OrderGateway->newRow();


        $newOrder->populate($insertData);

        //$requestData = json_decode('{"price":20, "qty":2132892}', true);
        //$newTransaction->populate($requestData);
        $newOrder->save();
        $newOrderId = $newOrder['id'];

        // make a transaction...

        $insertData = array();

        $insertData['order_id'] = $newOrderId;
        $insertData['rider_id'] = $data['selectedRider']['id'];
        $insertData['payment_type_id'] = $data['selected_payment_type']['id'];
        $insertData['sub_total'] = $data['order_total'];
        $insertData['type'] = $data['selected_payment_type']['name'];




        // Want an array with that?
        //$newTransaction = $newTransaction->toArray();

        switch ($data['selected_payment_type']['name']) {
            case "Credit Card":

                $insertData['cc_last_four'] = substr($data['credit_card_number'],-4,4);
                $insertData['cc_expiration'] = $data['credit_card_exp_month'] . '/' . $data['credit_card_exp_year'];

                $result = AuthorizeTransaction($data);



                if ($result->approved) {

                    // move on...
                    $insertData['cc_result'] = "approved";
                    $insertData['authorize_transaction_id'] = $result->transaction_id;

                } else if ($result->declined) {

                    $insertData['cc_result'] = "declined";
                    // handle error...
                } else if ($result->error) {

                    $insertData['cc_result'] = "error";
                    // handle error...
                }

                //return ["Its a credit card!", $result, $data];
            break;
            case "Comp":
                $insertData['comp_reason_id'] = $data['selected_comp_reason']['id'];
                $insertData['comp_reason_note'] = '';
                $insertData['selected_comp_reason_title'] = $data['selected_comp_reason']['title'];
                //return ["Its a comp!"];
            break;
            case "Gift Card":
                $insertData['gift_card_code'] = $data['gift_card_code'];
                //return ["Its a gift card!"];
            break;
            case "Cash":
                $insertData['cash_amount_received'] = $data['cash_amount_received'];

                //return ["Its cash!"];
            break;
            default:
                // this should error
                return array("I don't know what it is!");
            break;
        }

        $TransactionGateway = $this->makeGateway('transactions');
        $newTransaction = $TransactionGateway->newRow();


        $newTransaction->populate($insertData);

        //$requestData = json_decode('{"price":20, "qty":2132892}', true);
        //$newTransaction->populate($requestData);
        $newTransaction->save();
        $newTransactionId = $newTransaction['id'];


        // populate the items...

        $ItemGateway = $this->makeGateway('products_transactions');

        foreach($data['activeProductsCollection'] as $item) {
            $insertData = array();
            $insertData['transaction_id'] = $newTransactionId;
            $insertData['product_id'] = $item['id'];
            
            //unset($insertData['sizes']);
            $insertData = array_merge($item, $insertData);
            unset($insertData['sizes']);
            unset($insertData['styles']);
            unset($insertData['id']);
            $newItem = $ItemGateway->newRow();
            $newItem->populate($insertData);
            $newItem->save();
        }


        return array(result => 'success', new_order_id =>  $newOrderId, new_transaction_id =>  $newTransactionId);

    }

}

require_once 'anet_php_sdk/AuthorizeNet.php'; 
define("AUTHORIZENET_API_LOGIN_ID", "22fNq4M6mF");
define("AUTHORIZENET_TRANSACTION_KEY", "59B98r3BN98rM3f7");
define("AUTHORIZENET_SANDBOX", true);
function AuthorizeTransaction($data) {

    
    $auth = new AuthorizeNetAIM;
    $auth->amount = $data['order_total'];
    $auth->card_num = $data['credit_card_number'];
    $auth->exp_date = $data['credit_card_exp_month'] . '/' . $data['credit_card_exp_year'];

    // add the line items

//return $data['activeProductsCollection'].length;
for ($i=0; $i<count($data['activeProductsCollection']); $i++)
  {
        $product = $data['activeProductsCollection'][$i];
        
      $auth->addLineItem(
          $product['id'], // Item Id
          $product['title'], // Item Name
          $product['description'], // Item Description
          $product['quantity'], // Item Quantity
          $product['price'], // Item Unit Price
          'N' // Item taxable
      );
  }
    $response = $auth->authorizeAndCapture();
    if ($response->approved) {
        $transaction_id = $response->transaction_id;
    }
    return $response;
}



$aclProvider = Bootstrap::get('AclProvider');
$ZendDb = Bootstrap::get('ZendDb');
$olddb = Bootstrap::get('olddb');

$cashRegister = new cashRegister($ZendDb, $olddb, $aclProvider);

$params = array_slice($request, 5);

/**
 * @todo this is unstable and very insecure, calling a method by name using an
 * unsanitized user input!
 */
$results = call_user_func_array(array($cashRegister, $params[0]), array_slice($params, 1));

/**
 * Return the results to the API front controller.
 */
return $results;
