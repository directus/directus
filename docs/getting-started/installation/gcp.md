# Google Cloud Platform

While there are many different ways to run Directus on GCP, from single
[Compute Engine](https://cloud.google.com/compute) instances to a full
[Kubernetes Enginge](https://cloud.google.com/kubernetes-engine) stack, we like the following combination of services:

- [Google Cloud Run](https://cloud.google.com/run)
- [Google Cloud SQL](https://cloud.google.com/sql)
- [Google Cloud Storage](https://cloud.google.com/storage)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)

## Google Cloud Run

Will run Directus in an autoscaling managed container environment. Google Cloud Run will scale back to zero instances by
default but can be configured to meet every scalability requirements.

While there a numerous ways to get a Docker container up and running in Cloud Run, we will talk you through a setup that
is secure and production ready. This means:

- The database we will set up is only accessible through a private VPC, meaning only services within the Google Cloud
  project context can access this database.
- We will store the entire .env file of Directus encrypted in Secret Manager. This encrypted .env will be retrieved and
  decrypted by the container instance itself upon startup.
- Directus, while running in Google Cloud Run, will access Google Cloud Storage and Google Cloud SQL using the default
  [Cloud Run credentials](https://cloud.google.com/run/docs/securing/service-identity), no extra Google Cloud
  credentials are needed.

## Google Cloud SQL

Fully managed relational database service for MySQL, PostgreSQL, and SQL Server. This will be the persistent database
layer. In this guide we will use PostgreSQL.

## Google Cloud Storage

Will be used as object/file storage.

## Secret Manager

## Cloud Run click to deploy

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/directus/directus)

## Things to overthink

- Cloud run request context, CPU allocation
- Caching REDIS
- Fixed IP
- Cloud Scheduler
- Cloud Tasks

## Cost

Run scale back to 0 cpu allication DB persistent, cost Storage persistent cost

We recommend setting up a repo in GitHub (or another Git provider) and configuring it using
[our manual installation flow](/getting-started/installation/manual). This allows you to later hook up the repo to your
Elastic Beanstalk instance through CodeDeploy.

See
[Deploying Node.js applications to Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)
for more information.

Directus' configuration is all set through environment variables. For a full overview of all available environment
variables, see [Environment Variables](/configuration/config-options)

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
