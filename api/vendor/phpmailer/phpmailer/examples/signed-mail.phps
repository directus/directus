<?php
/**
 * This example shows signing a message and then sending it via the mail() function of PHP.
 * 
 * Before you can sign the mail certificates are needed.
 *
 *
 * STEP 1 - Creating a certificate:
 * You can either use a self signed certificate, pay for a signed one or use free alternatives such as StartSSL/Comodo etc.
 * Check out this link for more providers: http://kb.mozillazine.org/Getting_an_SMIME_certificate
 * In this example I am using Comodo.
 * The form is directly available via https://secure.comodo.com/products/frontpage?area=SecureEmailCertificate
 * Fill it out and you'll get an email with a link to download your certificate.
 * Usually the certificate will be directly installed into your browser (FireFox/Chrome).
 * 
 *
 * STEP 2 - Exporting the certificate
 * This is specific to your browser, however, most browsers will give you the option to export your recently added certificate in PKCS12 (.pfx)
 * Include your private key if you are asked for it.
 * Set up a password to protect your exported file.
 * 
 * STEP 3 - Splitting the .pfx into a private key and the certificate.
 * I use openssl for this. You only need two commands. In my case the certificate file is called 'exported-cert.pfx'
 * To create the private key do the following:
 *
 * openssl pkcs12 -in exported-cert.pfx -nocerts -out cert.key
 * 
 * Of course the way you name your file (-out) is up to you.
 * You will be asked for a password for the Import password. This is the password you just set while exporting the certificate into the pfx file.
 * Afterwards, you can password protect your private key (recommended)
 * Also make sure to set the permissions to a minimum level and suitable for your application.
 * To create the certificate file use the following command:
 * 
 * openssl pkcs12 -in exported-cert.pfx -clcerts -nokeys -out cert.crt
 *
 * Again, the way you name your certificate is up to you. You will be also asked for the Import Password.
 * To create the certificate-chain file use the following command:
 *
 * openssl pkcs12 -in exported-cert.pfx -cacerts -out certchain.pem
 *
 * Again, the way you name your chain file is up to you. You will be also asked for the Import Password.
 *
 *
 * STEP 3 - Code
 */

require '../PHPMailerAutoload.php';

//Create a new PHPMailer instance
$mail = new PHPMailer();
//Set who the message is to be sent from
//IMPORTANT: This must match the email address of your certificate.
//Although the certificate will be valid, an error will be thrown since it cannot be verified that the sender and the signer are the same person.
$mail->setFrom('from@example.com', 'First Last');
//Set an alternative reply-to address
$mail->addReplyTo('replyto@example.com', 'First Last');
//Set who the message is to be sent to
$mail->addAddress('whoto@example.com', 'John Doe');
//Set the subject line
$mail->Subject = 'PHPMailer mail() test';
//Read an HTML message body from an external file, convert referenced images to embedded,
//Convert HTML into a basic plain-text alternative body
$mail->msgHTML(file_get_contents('contents.html'), dirname(__FILE__));
//Replace the plain text body with one created manually
$mail->AltBody = 'This is a plain-text message body';
//Attach an image file
$mail->addAttachment('images/phpmailer_mini.png');

//Configure message signing (the actual signing does not occur until sending)
$mail->sign(
    '/path/to/cert.crt', //The location of your certificate file
    '/path/to/cert.key', //The location of your private key file
    'yourSecretPrivateKeyPassword', //The password you protected your private key with (not the Import Password! may be empty but parameter must not be omitted!)
    '/path/to/certchain.pem' //The location of your chain file
);

//Send the message, check for errors
if (!$mail->send()) {
    echo "Mailer Error: " . $mail->ErrorInfo;
} else {
    echo "Message sent!";
}

/**
 * REMARKS:
 * If your email client does not support S/MIME it will most likely just show an attachment smime.p7s which is the signature contained in the email.
 * Other clients, such as Thunderbird support S/MIME natively and will validate the signature automatically and report the result in some way.
 */
?>
