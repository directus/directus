# Introduction

This Helm chart is used for deploying Directus releases to Kubernetes. Currently, it uses Bitnami's Postgresql Helm chart to provide a database. As such, you can pass in configurations for that database through the `postgresql` property in `values.yaml`.