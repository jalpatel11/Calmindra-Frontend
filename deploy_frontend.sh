#!/bin/bash

# Exit on error
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Calmindra Next.js Frontend Cloud Run Deployer ===${NC}"

# 1. Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env is missing!${NC}"
    echo -e "Please create '.env' using '.env.example' as a template before running this deployer."
    exit 1
fi

# Load variables from .env
export $(grep -v '^#' .env | xargs)

# Validate loaded variables
if [ -z "$BACKEND_URL" ] || [ -z "$BACKEND_API_SECRET" ] || [ -z "$AUTH_SECRET" ]; then
    echo -e "${RED}Error: Missing required frontend environment variables in .env!${NC}"
    echo -e "Ensure BACKEND_URL, BACKEND_API_SECRET, and AUTH_SECRET are set."
    exit 1
fi

# 2. Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed on this system.${NC}"
    echo -e "Please install the Google Cloud SDK first: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 3. Prompt for Project ID
echo -n "Enter your GCP Project ID: "
read GCP_PROJECT_ID
if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID cannot be empty.${NC}"
    exit 1
fi

echo -e "${YELLOW}Setting GCP active project to: $GCP_PROJECT_ID...${NC}"
gcloud config set project "$GCP_PROJECT_ID"

# 4. Enable required APIs
echo -e "${YELLOW}Enabling GCP services (Cloud Run, Secret Manager, Artifact Registry)...${NC}"
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com

# 5. Get Project Number and setup service account
PROJECT_NUMBER=$(gcloud projects describe "$GCP_PROJECT_ID" --format="value(projectNumber)")
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# 6. Create Secrets in GCP Secret Manager & Grant Access
create_secret_if_missing() {
    local SECRET_NAME=$1
    local SECRET_VAL=$2
    
    echo -e "${YELLOW}Checking secret '$SECRET_NAME' in GCP...${NC}"
    if ! gcloud secrets describe "$SECRET_NAME" &> /dev/null; then
        echo -e "${YELLOW}Creating secret '$SECRET_NAME'...${NC}"
        echo -n "$SECRET_VAL" | gcloud secrets create "$SECRET_NAME" --data-file=-
    else
        echo -e "${GREEN}Secret '$SECRET_NAME' already exists. Adding new version...${NC}"
        echo -n "$SECRET_VAL" | gcloud secrets versions add "$SECRET_NAME" --data-file=-
    fi
    
    # Grant accessor role to Cloud Run compute service account
    gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
      --role="roles/secretmanager.secretAccessor" \
      --member="serviceAccount:$RUNTIME_SA" &> /dev/null
}

create_secret_if_missing "backend-api-secret" "$BACKEND_API_SECRET"
create_secret_if_missing "auth-secret" "$AUTH_SECRET"

# 7. Deploy to GCP Cloud Run
echo -e "${YELLOW}Deploying Next.js frontend to Cloud Run... (This builds the image in GCP Cloud Build and deploys)${NC}"

gcloud run deploy calmindra-frontend \
  --source=. \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=3 \
  --min-instances=0 \
  --set-env-vars="BACKEND_URL=$BACKEND_URL,AUTH_TRUST_HOST=${AUTH_TRUST_HOST:-true},AUTH_URL=${AUTH_URL:-https://calmindra.jalpatel.dev}" \
  --set-secrets="BACKEND_API_SECRET=backend-api-secret:latest,AUTH_SECRET=auth-secret:latest"

echo ""
echo -e "${GREEN}=== Deployment Successful! ===${NC}"
echo -e "Your Next.js frontend service is now running serverless in GCP Cloud Run."
echo ""
