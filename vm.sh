#!/bin/bash

# 1. Configuration - Replace these with your desired values
PROJECT_ID="focused-world-478518-j3"
TEMPLATE_NAME="trip-sync-base"
REGION="asia-southeast1"

# 2. Check for input name
if [ -z "$1" ]; then
    echo "Usage: ./spin-up-vm.sh [new-vm-name] [zone]"
    echo "Example: ./spin-up-vm.sh api-gateway asia-southeast1-b"
    exit 1
fi

NEW_VM_NAME=$1
ZONE=${2:-"asia-southeast1-b"} # Default to zone b if not specified

echo "🚀 Spinning up VM '$NEW_VM_NAME' in zone '$ZONE' using template '$TEMPLATE_NAME'..."


# 3. Create the instance
gcloud compute instances create "$NEW_VM_NAME" \
    --project="$PROJECT_ID" \
    --zone="$ZONE" \
    --source-instance-template="projects/$PROJECT_ID/regions/$REGION/instanceTemplates/$TEMPLATE_NAME"

echo "⏳ Waiting for SSH to be ready (this can take 60s)..."
# This loop checks every 5 seconds if port 22 is open on the new VM
# Note: This works best if the VM has a public IP or you are on a VPN
# Since you use IAP, we can use a simple 'sleep' or a gcloud probe
until gcloud compute ssh "$NEW_VM_NAME" --zone="$ZONE" --tunnel-through-iap --command="echo 'SSH is ready!'" &> /dev/null
do
    printf "."
    sleep 5
done

echo -e "\n✅ VM is up and SSH is accessible!"
