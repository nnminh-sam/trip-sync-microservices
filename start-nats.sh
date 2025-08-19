#!/bin/bash

# Start NATS server with custom configuration for Trip Sync

echo "Starting NATS server with increased payload limits..."

# Check if running with Docker
if command -v docker &> /dev/null; then
    echo "Using Docker to start NATS..."
    docker-compose -f docker-compose.nats.yml up -d
    echo "NATS server started in Docker container 'trip-sync-nats'"
    echo "Client port: 4222"
    echo "Monitoring port: 8222"
    echo "Max payload: 50MB"
else
    # Start NATS directly if installed locally
    if command -v nats-server &> /dev/null; then
        echo "Starting NATS server locally..."
        nats-server -c nats-server.conf &
        echo "NATS server started with custom configuration"
        echo "Client port: 4222"
        echo "Monitoring port: 8222"
        echo "Max payload: 50MB"
    else
        echo "Error: Neither Docker nor nats-server found!"
        echo "Please install Docker or NATS server:"
        echo "  Docker: https://docs.docker.com/get-docker/"
        echo "  NATS: brew install nats-server (macOS) or see https://docs.nats.io/running-a-nats-service/introduction/installation"
        exit 1
    fi
fi

echo ""
echo "To check NATS server status:"
echo "  curl http://localhost:8222/varz"
echo ""
echo "To stop NATS server:"
echo "  Docker: docker-compose -f docker-compose.nats.yml down"
echo "  Local: killall nats-server"