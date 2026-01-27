# Deployment Guide - Cloud Run with GitHub Actions & WIF

This guide explains how to deploy the AI Job Alchemist app to Google Cloud Run using GitHub Actions with Workload Identity Federation (WIF) for secure, keyless authentication.

## Prerequisites

- Google Cloud Project with billing enabled
- GitHub repository
- `gcloud` CLI installed locally

## Step 1: Set Up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
export REGION="us-central1"
export SERVICE_ACCOUNT_NAME="github-actions-sa"
export POOL_NAME="github-pool"
export PROVIDER_NAME="github-provider"
export GITHUB_ORG="your-github-username-or-org"
export GITHUB_REPO="your-repo-name"

# Set the project
gcloud config set project $PROJECT_ID
```

## Step 2: Enable Required APIs

```bash
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

## Step 3: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create cloud-run \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker images for Cloud Run"
```

## Step 4: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="GitHub Actions Service Account"

# Get the service account email
export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

## Step 5: Create Workload Identity Pool

```bash
# Create the pool
gcloud iam workload-identity-pools create $POOL_NAME \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Get the pool ID
export POOL_ID=$(gcloud iam workload-identity-pools describe $POOL_NAME \
  --location="global" \
  --format="value(name)")
```

## Step 6: Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --location="global" \
  --workload-identity-pool=$POOL_NAME \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-condition="assertion.repository_owner=='${GITHUB_ORG}'"
```

## Step 7: Allow GitHub to Impersonate Service Account

```bash
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}"
```

## Step 8: Get WIF Provider Full Name

```bash
# Get the full provider name for GitHub secrets
export WIF_PROVIDER=$(gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
  --location="global" \
  --workload-identity-pool=$POOL_NAME \
  --format="value(name)")

echo "WIF_PROVIDER: $WIF_PROVIDER"
echo "WIF_SERVICE_ACCOUNT: $SERVICE_ACCOUNT_EMAIL"
```

## Step 9: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your GCP Project ID |
| `WIF_PROVIDER` | Output from Step 8 (format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_NAME/providers/PROVIDER_NAME`) |
| `WIF_SERVICE_ACCOUNT` | Service account email (format: `SERVICE_ACCOUNT_NAME@PROJECT_ID.iam.gserviceaccount.com`) |
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Firebase Measurement ID |

## Step 10: Deploy

Push to the `main` branch or manually trigger the workflow:

```bash
git add .
git commit -m "Add Cloud Run deployment"
git push origin main
```

## Verify Deployment

Check the GitHub Actions tab in your repository to see the deployment progress. Once complete, you'll see the Cloud Run URL in the workflow output.

## Troubleshooting

### Permission Denied Errors

If you see permission errors, ensure:
1. The service account has the correct IAM roles
2. The WIF provider attribute condition matches your GitHub org/username
3. The repository name matches exactly in the principal set

### Image Push Failures

Ensure the Artifact Registry repository exists and the service account has `artifactregistry.writer` role.

### Cloud Run Deployment Failures

Check that:
1. The service account has `run.admin` and `iam.serviceAccountUser` roles
2. The region is correct
3. The image was successfully pushed to Artifact Registry

## Clean Up

To delete all resources:

```bash
# Delete Cloud Run service
gcloud run services delete ai-job-alchemist --region=$REGION

# Delete Artifact Registry repository
gcloud artifacts repositories delete cloud-run --location=$REGION

# Delete WIF provider and pool
gcloud iam workload-identity-pools providers delete $PROVIDER_NAME \
  --location="global" \
  --workload-identity-pool=$POOL_NAME

gcloud iam workload-identity-pools delete $POOL_NAME --location="global"

# Delete service account
gcloud iam service-accounts delete $SERVICE_ACCOUNT_EMAIL
```
