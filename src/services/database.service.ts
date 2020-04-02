import Knex, * as knex from 'knex'
import { IDatabaseConfig } from '../config';

/**
 * Database connection provider
 */
export class DatabaseService {
    /**
     * Configuration of database service
     */
    private config: IDatabaseConfig;

    /**
     * Database connection link
     */
    private connection: knex;

    /**
     * Create database service instance and save config.
     * Database connection is done asynchronously and therefore cannot run from constructor.
     * 
     * @param config Configuration of database service
     */
    constructor(config: IDatabaseConfig) {
        this.config = config;
    }

    /**
     * Provide database connection link.
     * Will attempt to instantiate connection if not connected
     * 
     * @async
     * @returns Connection link
     */
    public async getConnection(): Promise<knex> {
        if (!this.isConnected()) {
            this.connection = await this.createConnection();
        }

        return this.connection;
    }

    /**
     * Provide database transaction link.
     * Will attempt to instantiate connection if not connected
     * 
     * @async
     * @returns Transaction link
     */
    public async getTransaction(): Promise<knex.Transaction> {
        if (!this.isConnected()) {
            this.connection = await this.createConnection();
        }
    
        return new Promise<knex.Transaction>((resolve, reject) => {
            try {
                this.connection.transaction((trx: knex.Transaction) => {
                    resolve(trx);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Checks whether database connection exists
     * 
     * @private
     * @returns Boolean
     */
    private isConnected(): boolean {
        return (!!this.connection);
    }

    /**
     * Create database connection and return connection link
     * 
     * @async
     * @private
     * @returns Connection link
     */
    private async createConnection(): Promise<knex> {
        // Build Knex configuration
        const dbConfig: knex.Config = {
            client: this.config.client,
            connection: {
              host: this.config.host,
              port: this.config.port,
              user: this.config.user,
              password: this.config.password,
              database: this.config.database
            },
            debug: this.config.debug
        }
        
        // Instantiate Knex
        const db = Knex(dbConfig);

        // Test database connection
        db.raw("SELECT 1");

        return db;
    }

    /**
     * Close database connection
     * 
     * @async
     */
    public async closeConnection() {
        if (this.isConnected()) {
            await this.connection.destroy()
            this.connection = undefined
        }
    }
}