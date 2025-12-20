#!/bin/bash

# Configuration
PROJECT="focused-world-478518-j3"
ZONE="asia-southeast1-b"

# Check if a VM name was provided
if [ -z "$1" ]; then
    echo "Usage: ./ssh.sh [vm-name] [debug-flag]"
    echo "Example: ./ssh.sh api-gateway -v"
    exit 1
fi

VM_NAME=$1
DEBUG_FLAG=$2

echo "🚀 Connecting to $VM_NAME in $PROJECT via IAP Tunnel..."

# If the second argument exists, it will be passed to SSH
if [ ! -z "$DEBUG_FLAG" ]; then
    echo "🐞 Debug mode enabled: $DEBUG_FLAG"
    gcloud compute ssh "$VM_NAME" \
        --tunnel-through-iap \
        --project="$PROJECT" \
        --zone="$ZONE" \
        -- $DEBUG_FLAG
else
    gcloud compute ssh "$VM_NAME" \
        --tunnel-through-iap \
        --project="$PROJECT" \
        --zone="$ZONE"
fi