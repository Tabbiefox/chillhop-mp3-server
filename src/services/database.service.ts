import Knex, * as knex from 'knex'
import { IDatabaseConfig } from '../config';

export class DatabaseService {
    private config: IDatabaseConfig;

    private connection: knex;

    constructor(config: IDatabaseConfig) {
        this.config = config;
    }

    public async getConnection(): Promise<knex> {
        if (!this.isConnected()) {
            this.connection = await this.createConnection(this.config);
        }
      
        return this.connection;
    }

    public async getTransaction(): Promise<knex.Transaction> {
        const connection = await this.getConnection()
    
        return new Promise<knex.Transaction>((resolve, reject) => {
            try {
                connection.transaction((trx: knex.Transaction) => {
                    resolve(trx);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    private isConnected(): boolean {
        return (!!this.connection);
    }

    private async createConnection(config: IDatabaseConfig): Promise<knex> {
        const dbConfig: knex.Config = {
            client: config.client,
            connection: {
              host: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database
            },
            debug: config.debug
        }
        
        const db = Knex(dbConfig);

        // Test database connection
        db.raw("SELECT 1");

        return db;
    }

    public async closeConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.destroy()
            this.connection = undefined
        }
    }
}