<?php
/**
 * This example shows how to use POP-before-SMTP for authentication.
 */

require '../PHPMailerAutoload.php';

//Authenticate via POP3.
//After this you should be allowed to submit messages over SMTP for a while.
//Only applies if your host supports POP-before-SMTP.
$pop = POP3::popBeforeSmtp('pop3.example.com', 110, 30, 'username', 'password', 1);

//Create a new PHPMailer instance
//Passing true to the constructor enables the use of exceptions for error handling
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    //Enable SMTP debugging
    // 0 = off (for production use)
    // 1 = client messages
    // 2 = client and server messages
    $mail->SMTPDebug = 2;
    //Ask for HTML-friendly debug output
    $mail->Debugoutput = 'html';
    //Set the hostname of the mail server
    $mail->Host = "mail.example.com";
    //Set the SMTP port number - likely to be 25, 465 or 587
    $mail->Port = 25;
    //Whether to use SMTP authentication
    $mail->SMTPAuth = false;
    //Set who the message is to be sent from
    $mail->setFrom('from@example.com', 'First Last');
    //Set an alternative reply-to address
    $mail->addReplyTo('replyto@example.com', 'First Last');
    //Set who the message is to be sent to
    $mail->addAddress('whoto@example.com', 'John Doe');
    //Set the subject line
    $mail->Subject = 'PHPMailer POP-before-SMTP test';
    //Read an HTML message body from an external file, convert referenced images to embedded,
    //and convert the HTML into a basic plain-text alternative body
    $mail->msgHTML(file_get_contents('contents.html'), dirname(__FILE__));
    //Replace the plain text body with one created manually
    $mail->AltBody = 'This is a plain-text message body';
    //Attach an image file
    $mail->addAttachment('images/phpmailer_mini.png');
    //send the message
    //Note that we don't need check the response from this because it will throw an exception if it has trouble
    $mail->send();
    echo "Message sent!";
} catch (phpmailerException $e) {
    echo $e->errorMessage(); //Pretty error messages from PHPMailer
} catch (Exception $e) {
    echo $e->getMessage(); //Boring error messages from anything else!
}
