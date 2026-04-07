import pino from "pino";

const isDev = import.meta.env?.DEV ?? true;

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export const createLogger = (context: string) => ({
  debug: (msg: string, ...args: unknown[]) => logger.debug({ context }, msg, ...args),
  info: (msg: string, ...args: unknown[]) => logger.info({ context }, msg, ...args),
  warn: (msg: string, ...args: unknown[]) => logger.warn({ context }, msg, ...args),
  error: (msg: string, ...args: unknown[]) => logger.error({ context }, msg, ...args),
});
