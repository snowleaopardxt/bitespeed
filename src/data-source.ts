import "reflect-metadata";
import { DataSource } from "typeorm";
import { Contact } from "./entities/Contact";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "bitespeed",
    synchronize: true,
    logging: false,
    entities: [Contact],
    migrations: [],
    subscribers: [],
    ssl: {
        rejectUnauthorized: false
    },
    extra: {
        ssl: {
            sslmode: 'require'
        }
    }
}); 