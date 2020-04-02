import { IConfig } from './config';
import express from 'express';
import HTTPErrors from 'http-errors';
import ApiRouter from './routes/api.routes';
import { DatabaseService, RadioService, StorageService } from './services';
import { TrackProvider, PlaylistProvider, RadioProvider } from './providers';
import createHttpError from 'http-errors';

export interface IAppServices {
    database: DatabaseService,
    radio: RadioService,
    storage: StorageService
}
export interface IAppProviders {
    track: TrackProvider,
    playlist: PlaylistProvider,
    radio: RadioProvider
}

let services: IAppServices = null;
let providers: IAppProviders = null;

/**
 * Instantiate and save services and data providers
 * for future use across the application
 * 
 * @param config App configuration
 */
export function initServices(config: IConfig) {
    // Instantiate the database service
    const db = new DatabaseService(config.database);
    
    // Instantiate and save data providers
    providers = {
        track: new TrackProvider(db),
        playlist: new PlaylistProvider(db),
        radio: new RadioProvider(db)
    }

    // Instantiate and save singleton services
    services = {
        database: db,
        radio: new RadioService(config.radio),
        storage: new StorageService(config.storage)
    };
}

/**
 * Provide access to the services repository
 * 
 * @returns Object holding instances of services
 */
export function getServices(): IAppServices {
    return Object.assign({}, services);
}

/**
 * Provide access to the data provider repository
 * 
 * @returns Object holding instances of data providers
 */
export function getProviders(): IAppProviders {
    return Object.assign({}, providers);
}

/**
 * Get server instance and configure middleware
 * 
 * @param config App configuration
 * @returns Server instance
 */
export function initServer(config: IConfig): express.Express {
    const server = express();
    server.use(express.json({ limit: '50mb' }));
    return server;
}

/**
 * Register app routes to the server instance
 * 
 * @param server Server instance
 */
export function initServerRoutes(server: express.Express): void {
    // Register known routes
    server.use('/api', ApiRouter);

    // Register route fallback for every other request
    server.use(function (req, res, next) {
        return next(createHttpError(404, 'Resource not found'));
    });
}

/**
 * Register default error handler to the server instance
 * 
 * @param server Server instance
 */
export function initServerErrorHandler(server: express.Express): void {
    server.use((err, req, res, next) => {
        if (err instanceof HTTPErrors.HttpError) {
            const error = {
                code: err.status || 500,
                message: err.message || 'Unknown error occured'
            }
            res.status(error.code).send({ error });
        }
    });
}