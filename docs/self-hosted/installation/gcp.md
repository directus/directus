# Google Cloud Platform

While there are many different ways to run Directus on GCP, from single
[Compute Engine](https://cloud.google.com/compute) instances to a full
[Kubernetes Engine](https://cloud.google.com/kubernetes-engine) stack, we like the following combination of services:

- [Google Cloud Run](https://cloud.google.com/run)
- [Google Cloud SQL](https://cloud.google.com/sql)
- [Google Cloud Storage](https://cloud.google.com/storage)

## Google Cloud Run

We will run Directus in an autoscaling managed container environment called Google Cloud Run. Google Cloud Run will
scale back to zero instances by default but can be configured to meet every scalability requirements.

While there a numerous ways to get a Docker container up and running in Cloud Run, we will talk you through a simple
setup with still a lot of improvements to be made. The section [Additional improvements](#additional-improvements)
stipulates additional improvements you can make to your setup.

## Google Cloud SQL

Fully managed relational database service for MySQL, PostgreSQL, and SQL Server. This will be the persistent database
layer. In this guide we will use PostgreSQL.

## Google Cloud Storage

Will be used as object/file storage. Since we're running Directus in Google Cloud, it'll be authenticated and authorized
to access all storage buckets in the same Google Cloud project by default. We just need to set it up in the environment
variables.

## Cost

Running Directus in Google Cloud can and will infer costs. Please read and understand all pricing options per service
before rolling out Directus on Google Cloud. As a rule of thumb you could say that with the setup written here the main
costs come from a persistent Postgres in CloudSQL. You can estimate the pricing here:
[https://cloud.google.com/products/calculator](https://cloud.google.com/products/calculator)

## Cloud Run click to deploy

Just to see Directus work on Google Cloud you can try it out by clicking this button. Keep in mind, this will use a non
persistent SQLite database inside the container itself, so everything will be lost once the container shuts down. And it
will shut down.

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/directus-community/gcp-example)

After deploying you can login with `admin@example.com` and `localpassword`

## Walkthrough complete setup

Let's get into it.

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install). We will run a lot of `gcloud` commands to
   get your GCP environment setup.

2. Go over the steps for [Manually installing Directus](/self-hosted/installation/manual)

3. Add a start script to your package.json like so:

```
"scripts": {
		"start": "npx directus bootstrap; npx directus start"
}
```

4. Add a new `Dockerfile` file to the root of your newly setup Directus folder and add these contents

```
FROM node:16-alpine

WORKDIR /src

ADD . /src

RUN npm install --production

CMD ["npm", "run", "start"]
```

5. Create a new project in
   [Google Cloud](https://cloud.google.com/resource-manager/docs/creating-managing-projects#creating_a_project):
   `gcloud projects create <your-project-id>` and make sure `your-project-id` is globally unique. Write down this ID as
   it will be used in all subsequent gcloud commands.

6. Add/link a billing account/details to your project by going here:
   `https://console.cloud.google.com/billing/linkedaccount?project=<your-project-id>`. Since the database and storage
   bucket are persistent, there are (costs)[#cost] involved.

7. Create a storage bucket where Directus will store files:

```
gsutil mb -p <your-project-id> -c standard -l europe-west4 gs://<unique-bucket-name>/
```

Some notes:

- The region (europe-west4) is the region where the bucket resides. It's a good idea, sometimes even mandatory, to set
  all services to the same region.
- The bucket name should be globally unique

8. Create a Postgres13 database:

```
gcloud sql instances create <database-instance-name> --region=europe-west4 --tier=db-f1-micro --project=<your-project-id> --database-version=POSTGRES_13
```

Some notes:

- The region (europe-west4) is the region where the database resides. It's a good idea, sometimes even mandatory, to set
  all services to the same region.
- The [tier](https://cloud.google.com/sql/docs/postgres/instance-settings) determines resources and cost of the
  database. For this example we've picked the smallest one.
- This operation will take a while. If, for some reason, the gcloud times out, you can still find your database instance
  and its status [here](https://console.cloud.google.com/sql/instances).

The output will look something like this:

```
Creating Cloud SQL instance...done.
Created [https://sqladmin.googleapis.com/sql/v1beta4/projects/your-project-id/instances/your-project-id-pg13].
NAME                         DATABASE_VERSION  LOCATION        TIER         PRIMARY_ADDRESS  PRIVATE_ADDRESS  STATUS
your-project-id-pg13         POSTGRES_13       europe-west4-b  db-f1-micro  123.456.789.0    -                RUNNABLE
```

Write down the IP address (in this example `123.456.789.0`), you'll need to set it in your `.env` later

9. Set the root user password in your database:

```
gcloud sql users set-password root --host=% --instance <database-instance-name> --password <your-safe-root-password> --project=<your-project-id>
```

10. Create the directus database:

```
gcloud sql databases create directus --instance=<database-instance-name> --project=<your-project-id>
```

In this example the database is called `directus`

11. Get the connection name of your CloudSQL instance:

```
gcloud sql instances describe <database-instance-name> --project=<your-project-id>
```

You will need the value of `connectionName` in step 12 and 14.

12. Add these items to your `.env` file:

```
DB_CLIENT="pg"
DB_PORT="5432"
DB_DATABASE=directus
DB_USER=root
DB_PASSWORD=<your-root-password>
DB_HOST=/cloudsql/<connection-name-from-step-11>

STORAGE_LOCATIONS="gcs"
STORAGE_GCS_DRIVER="gcs"
STORAGE_GCS_BUCKET=<your-bucket-name>

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="localpassword"

KEY="secretkey"
SECRET="secret"

####################################################################################################
## Google Cloud Logging

LOG_STYLE="raw"
LOGGER_LEVELS="trace:DEBUG,debug:DEBUG,info:INFO,warn:WARNING,error:ERROR,fatal:CRITICAL"
LOGGER_MESSAGE_KEY="message"

####################################################################################################
## With this setting you can set the level at which requests are logged

LOGGER_HTTP_USE_LEVEL="debug"
```

Notes:

- the value of `connectionName` from step 11 should be prefixed with `/cloudsql/` as the value of `DB_HOST`
- Google Cloud Logging variables are optional, but they make Directus logs show up with correct level in Google Cloud
  Logging.

13. Build your container Run these commands.

```
docker build -t eu.gcr.io/<your-project-id>/directus .
gcloud auth configure-docker -q
docker push eu.gcr.io/<your-project-id>/directus
```

This will build the Docker container, authenticate your docker installation with Google Cloud Platform and push the
container image to the container registry in your GCP project.

14. Deploy your container

```
gcloud run deploy directus \
     --project "<your-project-id>" \
     --image "eu.gcr.io/<your-project-id>/directus:latest" \
     --region "europe-west1" \
     --platform "managed" \
     --allow-unauthenticated \
     --add-cloudsql-instances "<database-connection-name-from-step11>"
```

Note: the value of `connectionName` from step 11 should be used as the value of `add-cloudsql-instances` without any
prefix.

15. Done! The deploy command should've told you the URL where you can access your Directus instance. You can login with
    `admin@example.com` and `localpassword`.

## Additional improvements

- You should make your CloudSQL instance only accessible through a private IP and VPC connector. This way only your
  current cloud project is able to access the database. More on this
  [here](https://cloud.google.com/sql/docs/postgres/connect-run#private-ip).
- You should not store your `.env` file locally and build it into your Dockerfile. Ideally you should save your `.env`
  file in [Google Cloud Secret Manager](https://cloud.google.com/secret-manager) and in your CI/CD pipeline retrieve it
  and add it to your container. Or, even better, let the container pick the `.env` up at runtime from Google Secret
  Manager.
- Cloud Run typically allocates resources in a request context. Meaning async hooks etc will get drastically less CPU
  and memory, often even resulting in those processes not completing. You have two options:
  [CPU allocation](https://cloud.google.com/run/docs/configuring/cpu-allocation) that is always allocated (which will
  increase cost) or handle everything in your extensions synchronously.
- You could setup [caching](/self-hosted/config-options/#cache) using
  [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- Since, by default, Google Cloud Run will scale back to zero instances of the container, it's impossible to use the
  [Schedule hooks](/extensions/hooks/#schedule) since there is no container to handle those schedules / cron jobs. Again
  you have two options: Set the minimum number of instances to 1, this will definitely increase cost as at least 1
  container keeps on running 24/7. Or you could use [Cloud Scheduler](https://cloud.google.com/scheduler) to schedule
  calls to custom endpoints which will do the tasks.
