# AWS

While there are many different ways to run Directus on AWS, from single EC2 instances to a full ELB load-balanced
configuration, we like the following combination of services:

- Elastic Beanstalk (EB)
  - Elastic Load-Balancer (ELB)
  - Elastic Compute Cloud (EC2)
- CodeDeploy
- Simple Storage Service (S3)
- Relational Database Service (RDS) (Aurora)
- CloudFront
- Route 53

## Elastic Beanstalk

Will run Directus in an autoscaling environment with a load balancer. Makes sure the instances stay alive, and will
replace individual instances in case of unexpected crashes.

We recommend setting up a repo in GitHub (or another Git provider) and configuring it using
[our manual installation flow](/guides/installation/manual/#installing-manually). This allows you to later hook up the repo to your Elastic
Beanstalk instance through CodeDeploy.

See
[Deploying Node.js applications to Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)
for more information.

Directus' configuration is all set through environment variables. For a full overview of all available environment
variables, see [Environment Variables](/reference/environment-variables)

## CodeDeploy

Allows you to automatically deploy updates to your Directus instance or extensions to Elastic Beanstalk.

See
[Automatically Deploy from GitHub Using AWS CodeDeploy](https://aws.amazon.com/blogs/devops/automatically-deploy-from-github-using-aws-codedeploy/)
for more information.

## Simple Storage Service (S3)

Ideal place to store files uploaded to Directus. Your bucket doesn't have to be publicly accessible to the web; Directus
will stream files from and to the bucket in its /asset endpoint.

See [Creating a bucket](https://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html) for more information.

## Relational Database Service (RDS) (Aurora)

While you can technically use any of the SQL based databases offered in AWS, we like to use Aurora. It's auto-scaling
and use-based costs have worked out pretty well for us in the past.

## CloudFront

While it's not a technical requirement, it's not a bad idea to configure a CloudFront instance in front of your EB
environment. This protects you from DDoS attacks and allows you to cache repeated calls to assets in its CDN.

See
[Using Elastic Beanstalk with Amazon CloudFront](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/AWSHowTo.cloudfront.html)
for more information.

## Route 53

The last piece of this puzzle is to assign a domain name to your CloudFront instance. You can use Route 53 for this
purpose.

See
[Routing traffic to an Amazon CloudFront web distribution by using your domain name](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html)
for more information.
