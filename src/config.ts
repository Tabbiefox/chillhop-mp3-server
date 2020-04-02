/**
 * Consume .env variables and expose them in `process.env`
 */
import dotenv from 'dotenv';
dotenv.config();

/**
 * Load configuration JSONs from ./config and export them for global use
 */
export { 
    config, 
    IConfig, 
    Database as IDatabaseConfig,
    Radio as IRadioConfig,
    Storage as IStorageConfig
} from 'node-config-ts';