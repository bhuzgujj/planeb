export type LoggingLevel = "error" | "info" | "warn" | "debug" | "none" | "db"
export type LoggerConfig = {
    level?: LoggingLevel,
    showOrigin?: boolean
}

export type DatabaseConfig = {
    folder: string,
    roomSubFolder: string,
    masterDbNames: string
}

export type GatewayConfig = {
    logging: LoggerConfig
    database: DatabaseConfig
}