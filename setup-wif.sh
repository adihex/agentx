#!/bin/bash
set -e

# Configuration
PROJECT_ID="agentx-zettel-adi-3291"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"
SA_NAME="github-actions-sa"
REPO="adihex/agentx"

echo "=== 1. Enabling IAM and Resource Manager APIs ==="
gcloud services enable iamcredentials.googleapis.com \
  --project="$PROJECT_ID"

echo "=== 2. Creating Workload Identity Pool ==="
if ! gcloud iam workload-identity-pools describe "$POOL_NAME" --project="$PROJECT_ID" --location="global" &>/dev/null; then
  gcloud iam workload-identity-pools create "$POOL_NAME" \
    --project="$PROJECT_ID" \
    --location="global" \
    --display-name="GitHub Actions Pool"
else
  echo "Pool $POOL_NAME already exists."
fi

WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --format="value(name)")

echo "=== 3. Creating OIDC Provider ==="
if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" --project="$PROJECT_ID" --location="global" --workload-identity-pool="$POOL_NAME" &>/dev/null; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.subject,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"
else
  echo "Provider $PROVIDER_NAME already exists."
fi

echo "=== 4. Creating Service Account ==="
if ! gcloud iam service-accounts describe "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" &>/dev/null; then
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Service Account"
else
  echo "Service account $SA_NAME already exists."
fi

echo "=== 5. Binding Service Account to GitHub Repo ==="
gcloud iam service-accounts add-iam-policy-binding "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO}"

echo "=== 6. Granting IAM Roles to Service Account ==="
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

echo "=== Done! ==="
echo "Your Workload Identity Provider string is:"
echo "projects/$PROJECT_ID/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"
echo "Your Service Account email is:"
echo "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
