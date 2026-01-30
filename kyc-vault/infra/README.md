# KYC Vault Infrastructure Setup

## Overview
The KYC Vault infrastructure is designed to support the KYC Vault application, which includes a backend API service and a frontend web application. This document provides instructions for setting up and running the infrastructure components using Docker and Docker Compose.

## Prerequisites
- Docker: Ensure that Docker is installed on your machine. You can download it from [Docker's official website](https://www.docker.com/get-started).
- Docker Compose: This is typically included with Docker Desktop installations.

## Setup Instructions

1. **Clone the Repository**
   Clone the KYC Vault repository to your local machine:
   ```
   git clone <repository-url>
   cd kyc-vault
   ```

2. **Build the Docker Images**
   Navigate to the `infra` directory and build the Docker images using Docker Compose:
   ```
   cd infra
   docker-compose build
   ```

3. **Initialize the MongoDB Database**
   The MongoDB service will be initialized with the provided scripts. Ensure that the `mongo-init/init.js` file is correctly set up to create necessary collections and indexes.

4. **Run the Services**
   Start the services defined in the `docker-compose.yml` file:
   ```
   docker-compose up
   ```
   This command will start the API service, web frontend, and MongoDB database.

5. **Access the Application**
   - The API service will be available at `http://localhost:3000`.
   - The web application will be accessible at `http://localhost:3001`.

## Usage Guidelines
- To stop the services, use `Ctrl + C` in the terminal where Docker Compose is running.
- To remove the containers and networks created by Docker Compose, run:
  ```
  docker-compose down
  ```

## Troubleshooting
- If you encounter issues with the MongoDB connection, ensure that the MongoDB service is running and that the connection string in the API service's environment variables is correct.
- Check the logs of the services for any errors:
  ```
  docker-compose logs
  ```

## Conclusion
This README provides a basic setup for the KYC Vault infrastructure. For further development and deployment instructions, refer to the documentation in the respective service directories.