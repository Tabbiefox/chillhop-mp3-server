import { IConfig } from './config';
import express from 'express';
import HTTPErrors from 'http-errors';
import ApiRouter from './routes/api.routes';
import { DatabaseService, RadioService, StorageService } from './services';
import { TrackProvider, PlaylistProvider, RadioProvider } from './providers';

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
 * Instantiates and populates services and providers
 * @param {IConfig} config App configuration object of type IConfig
 */
export function initServices(config: IConfig) {
    // Instantiate database service
    const db = new DatabaseService(config.database);
    
    // Instantiate and populate data providers
    providers = {
        track: new TrackProvider(db),
        playlist: new PlaylistProvider(db),
        radio: new RadioProvider(db)
    }

    // Instantiates and populates singleton services
    services = {
        database: db,
        radio: new RadioService(config.radio),
        storage: new StorageService(config.storage)
    };
}

/**
 * Provides a clone of the app services object
 * @returns {IServices} App services object
 */
export function getServices(): IAppServices {
    return Object.assign({}, services);
}

export function getProviders(): IAppProviders {
    return Object.assign({}, providers);
}

export function initServer(config: IConfig): express.Express {
    const server = express();
    server.use(express.json({ limit: '50mb' }));
    return server;
}

export function initServerRoutes(server: express.Express): void {
    server.use('/api', ApiRouter);
}

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

export function initScheduledTasks(): void {
    // void
}