#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 <service> [action] [--prod]"
    echo "  $0 <action> <service> [--prod]"
    echo ""
    echo -e "${GREEN}Available services:${NC}"
    echo "  gateway       - API Gateway service"
    echo "  user          - User management service"
    echo "  trip          - Trip management service"
    echo "  location      - Location tracking service"
    echo "  report        - Reporting service"
    echo "  gps           - GPS tracking service"
    echo "  task          - Task management service"
    echo "  audit         - Audit log service"
    echo "  notification  - Notification service"
    echo "  all           - All services"
    echo ""
    echo -e "${GREEN}Actions:${NC}"
    echo "  up            - Start service(s) in detached mode (default)"
    echo "  down          - Stop and remove service(s)"
    echo "  restart       - Restart service(s)"
    echo "  logs          - View logs for service(s)"
    echo "  ps            - List running containers"
    echo "  build         - Build or rebuild service(s)"
    echo "  pull          - Pull latest images"
    echo ""
    echo -e "${GREEN}Options:${NC}"
    echo "  --prod        - Use production configuration"
    echo ""
    echo -e "${GREEN}Examples:${NC}"
    echo "  $0 gateway                    # Start gateway service"
    echo "  $0 gateway up                 # Start gateway service"
    echo "  $0 up gateway                 # Start gateway service"
    echo "  $0 user down                  # Stop user service"
    echo "  $0 down user                  # Stop user service"
    echo "  $0 down all                   # Stop all services"
    echo "  $0 trip logs                  # View trip service logs"
    echo "  $0 logs trip                  # View trip service logs"
    echo "  $0 gateway --prod             # Start gateway with production config"
    echo "  $0 up gateway --prod          # Start gateway with production config"
}

SERVICE=$1
ACTION=${2:-up}
ENV_MODE="dev"

# Handle pattern: ./deploy.sh <action> <service>
if [[ "$1" == "up" ]] || [[ "$1" == "down" ]] || [[ "$1" == "restart" ]] ||
   [[ "$1" == "logs" ]] || [[ "$1" == "ps" ]] || [[ "$1" == "build" ]] || [[ "$1" == "pull" ]]; then
    ACTION=$1
    SERVICE=$2
    if [[ "$3" == "--prod" ]]; then
        ENV_MODE="prod"
    fi
# Handle pattern: ./deploy.sh <service> <action>
else
    if [[ "$2" == "--prod" ]] || [[ "$3" == "--prod" ]]; then
        ENV_MODE="prod"
        if [[ "$2" == "--prod" ]]; then
            ACTION="up"
        fi
    fi
fi

get_compose_file() {
    local service=$1
    local mode=$2
    local compose_file=""

    case $service in
        gateway)
            compose_file="api-gateway/docker-compose"
            ;;
        user)
            compose_file="user-micro/docker-compose"
            ;;
        trip)
            compose_file="trip-micro/docker-compose"
            ;;
        location)
            compose_file="location-micro/docker-compose"
            ;;
        report)
            compose_file="report-micro/docker-compose"
            ;;
        gps)
            compose_file="gps-micro/docker-compose"
            ;;
        task)
            compose_file="task-micro/docker-compose"
            ;;
        audit)
            compose_file="audit-log-micro/docker-compose"
            ;;
        notification)
            compose_file="notification-micro/docker-compose"
            ;;
        *)
            echo ""
            return
            ;;
    esac

    if [[ "$mode" == "prod" ]]; then
        echo "${compose_file}.prod.yml"
    else
        echo "${compose_file}.yml"
    fi
}

execute_docker_compose() {
    local compose_file=$1
    local action=$2

    if [[ ! -f "$compose_file" ]]; then
        echo -e "${RED}Error: Docker compose file not found: $compose_file${NC}"
        return 1
    fi

    echo -e "${BLUE}Executing: docker compose -f $compose_file $action${NC}"

    case $action in
        up)
            docker compose -f "$compose_file" up -d
            ;;
        down)
            docker compose -f "$compose_file" down
            ;;
        restart)
            docker compose -f "$compose_file" restart
            ;;
        logs)
            docker compose -f "$compose_file" logs -f
            ;;
        ps)
            docker compose -f "$compose_file" ps
            ;;
        build)
            docker compose -f "$compose_file" build
            ;;
        pull)
            docker compose -f "$compose_file" pull
            ;;
        *)
            echo -e "${RED}Unknown action: $action${NC}"
            return 1
            ;;
    esac
}

deploy_service() {
    local service=$1
    local action=$2
    local mode=$3

    local compose_file=$(get_compose_file "$service" "$mode")

    if [[ -z "$compose_file" ]]; then
        echo -e "${RED}Error: Unknown service: $service${NC}"
        print_usage
        exit 1
    fi

    echo -e "${GREEN}Deploying $service service ($mode mode)...${NC}"
    execute_docker_compose "$compose_file" "$action"
}

deploy_all() {
    local action=$1
    local mode=$2

    echo -e "${YELLOW}Deploying all services ($mode mode)...${NC}"

    local services=(gateway user trip location report gps task audit notification)
    local failed_services=()

    for service in "${services[@]}"; do
        echo -e "${BLUE}Processing $service service...${NC}"
        if ! deploy_service "$service" "$action" "$mode"; then
            failed_services+=("$service")
        fi
        echo ""
    done

    if [ ${#failed_services[@]} -gt 0 ]; then
        echo -e "${RED}Failed to deploy services: ${failed_services[*]}${NC}"
        exit 1
    else
        echo -e "${GREEN}All services deployed successfully!${NC}"
    fi
}

if [[ -z "$SERVICE" ]] || [[ "$SERVICE" == "-h" ]] || [[ "$SERVICE" == "--help" ]]; then
    print_usage
    exit 0
fi

case $ACTION in
    up|down|restart|logs|ps|build|pull)
        ;;
    *)
        if [[ "$ACTION" != "--prod" ]]; then
            echo -e "${RED}Error: Unknown action: $ACTION${NC}"
            print_usage
            exit 1
        fi
        ;;
esac

if [[ "$SERVICE" == "all" ]]; then
    deploy_all "$ACTION" "$ENV_MODE"
else
    deploy_service "$SERVICE" "$ACTION" "$ENV_MODE"
fi

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}Operation completed successfully!${NC}"
else
    echo -e "${RED}Operation failed!${NC}"
    exit 1
fi