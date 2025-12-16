import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { EnvSchema } from "src/config";
import { Logger, INestApplication } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  let app: INestApplication;

  try {
    app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService<EnvSchema>);

    const natsServer = configService.get("NATS_SERVER");
    const port = configService.get("APP_PORT") || 3004;
    const appName = configService.get("APP_NAME") || "gps-micro";

    // Enable graceful shutdown
    app.enableShutdownHooks();

    // Connect NATS microservice
    try {
      app.connectMicroservice({
        transport: Transport.NATS,
        options: {
          servers: natsServer ? [natsServer] : [],
        },
      });
      logger.log(`NATS microservice configured: ${natsServer ?? "unset"}`);
    } catch (error) {
      logger.error(
        `Failed to connect NATS microservice: ${(error as Error).message}`,
        (error as Error).stack
      );
      // Continue startup even if NATS fails (for development/testing)
    }

    // Start all microservices
    try {
      await app.startAllMicroservices();
      logger.log("All microservices started successfully");
    } catch (error) {
      logger.error(
        `Failed to start microservices: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }

    // Start HTTP server
    await app.listen(port);
    logger.log(`${appName} HTTP server running on port ${port}`);
    logger.log(`${appName} is ready to accept requests`);
  } catch (error) {
    logger.error(
      `Failed to start GPS microservice: ${(error as Error).message}`,
      (error as Error).stack
    );
    process.exit(1);
  }

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Close HTTP server
      if (app) {
        await app.close();
        logger.log("HTTP server closed");
      }

      logger.log("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error(
        `Error during graceful shutdown: ${(error as Error).message}`,
        (error as Error).stack
      );
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error(`Uncaught exception: ${error.message}`, error.stack);
    gracefulShutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(
      `Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
      reason instanceof Error ? reason.stack : undefined
    );
    gracefulShutdown("unhandledRejection");
  });
}

bootstrap();
