# Trip Sync Microservices

This project is a microservices-based backend system for managing user authentication, roles, and permissions. It is structured into multiple services, with a focus on scalability and modularity. The main services are:

- **api-gateway**: The entry point for all client requests. Handles authentication, routing, and communication with microservices.
- **user-micro**: Manages user data, authentication logic, roles, and permissions.

## Architecture

```
[Client]
   |
   v
[API Gateway] <----> [User Microservice]
```

- The **API Gateway** exposes a unified API and delegates requests to the appropriate microservices.
- The **User Microservice** handles user management, authentication, and authorization.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker](https://www.docker.com/) (for containerized deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nnminh-sam/trip-sync-microservices
cd trip-sync-microservices
```

### 2. Environment Variables

Each service has an `example.env` file. Copy it to `.env` and adjust values as needed:

```bash
cp api-gateway/example.env api-gateway/.env
cp user-micro/example.env user-micro/.env
```

### 3. Install Dependencies

Install dependencies for each service:

```bash
cd api-gateway && npm install && cd ..
cd user-micro && npm install && cd ..
```

### 4. Running with Docker Compose

You can run the services using Docker Compose for easy setup:

```bash
docker network create shared-microservices-net

# From the root directory
cd api-gateway
# For development
docker-compose up --build
# For production
docker-compose -f docker-compose.prod.yml up --build

# In another terminal
cd ../user-micro
docker-compose up --build
```

### 5. Running Locally (Without Docker)

Start each service in separate terminals:

```bash
# Terminal 1
cd api-gateway
npm run start:dev

# Terminal 2
cd user-micro
npm run start:dev
```

## Development Workflow

Follow these steps to set up and work on the project locally for any service (e.g., api-gateway, user-micro):

1. **Install Dependencies**

   ```bash
   npm install
   ```

   Run this inside each service directory after cloning the repo and setting up environment variables.

2. **Check Lint**

   ```bash
   npm run lint
   ```

   This checks code style and potential errors. Fix any issues before committing.

3. **Run in Development Mode**

   ```bash
   npm run start:dev
   ```

   This starts the service with hot-reloading for development.

4. **Build the Project**

   ```bash
   npm run build
   ```

   Compiles the TypeScript source code into JavaScript in the `dist/` directory.

5. **Run the Built Application**
   ```bash
   npm run start:prod
   ```
   Runs the compiled app from the `dist/` directory, simulating a production environment.

Repeat these steps for each service you want to develop or test.

## API Endpoints

- The API document is available at `http://localhost:3000/api-document`.
- The API Gateway exposes endpoints at `http://localhost:3000` (default).
- User microservice runs on its own port (see `.env` files for details).

**Note:** app port is base on the config in `.env` file.

## Project Structure

```
trip-sync-micro/
  api-gateway/    # API Gateway service
  user-micro/     # User management microservice
```

Each service contains its own source code, configuration, and Docker setup.

## Contributing

We welcome contributions! To keep the codebase clean and maintainable, please follow these guidelines:

### Branch Naming Prefixes Explained

- **feat/**: For new features or significant enhancements.
- **fix/**: For bug fixes or patches.
- **chore/**: For routine tasks, maintenance, or non-feature changes (e.g., dependency updates, build scripts).
- **docs/**: For documentation changes or improvements.
- **hotfix/**: For urgent fixes that need to be deployed quickly, usually to address critical bugs in production.

### Branch Naming Convention

- **Feature branches:** `feat/<short-description>`
  - Example: `feat/user-registration`
- **Bugfix branches:** `fix/<short-description>`
  - Example: `fix/login-error`
- **Chore branches:** `chore/<short-description>`
  - Example: `chore/update-dependencies`
- **Documentation branches:** `docs/<short-description>`
  - Example: `docs/api-endpoints`
- **Hotfix branches:** `hotfix/<short-description>`
  - Example: `hotfix/critical-bug`

### Contribution Workflow

1. **Fork the repository**
2. **Create your branch**
   - Use the appropriate prefix as described above.
   - Example: `git checkout -b feat/add-user-profile`
3. **Make your changes**
   - Write clear, concise commit messages.
   - Ensure your code follows the existing style and passes linting/tests.
4. **Push your branch**
   - `git push origin <your-branch-name>`
5. **Open a Pull Request**
   - Describe your changes and reference any related issues.
   - Ensure your PR title follows the branch naming convention.
6. **Code Review**
   - Address any feedback or requested changes.
7. **Merge**
   - Once approved, your PR will be merged by a maintainer.

### Additional Guidelines

- Write unit and integration tests for new features or bug fixes.
- Update documentation as needed.
- Keep pull requests focused and small; large PRs are harder to review.
- Be respectful and constructive in code reviews and discussions.

Thank you for helping improve this project!

## License

[MIT](LICENSE)
