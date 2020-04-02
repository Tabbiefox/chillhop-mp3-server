import { IStorageConfig } from '../config';
import * as mm from 'music-metadata';
import * as fs from 'fs';

/**
 * File storage service
 */
export class StorageService {
    /**
     * Configuration of storage service
     */
    private config: IStorageConfig;

    /**
     * Create storage service instance and ensure creation of root directory
     * 
     * @param config Configuration of storage service
     */
    constructor (config: IStorageConfig) {
        this.config = config;
        this.ensureDirExists('');
    }

    /**
     * Check if the path exists and create it
     * 
     * @param path Directory path
     */
    public ensureDirExists(path: string) {
        path = this.getPath(path);

        if (path && !fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    }

    /**
     * Save file Buffer to specified path
     * 
     * @async
     * @param path File path
     * @param data File Buffer
     */
    public async saveFile(path: string, data: Buffer) {
        path = this.getPath(path);
        
        return fs.promises.open(path, 'wx')
            .then((fileHandle) => { 
                return fs.promises.writeFile(fileHandle, data);
            })
            .catch((err) => { 
                switch (err.code){
                    case 'EEXIST':
                        throw new Error('File already exists (' + path + ')');
                    default:
                        throw err;
                }
            });
    }

    /**
     * Open file at the specified path and return its Buffer
     * 
     * @async
     * @param path File path
     */
    public async readFile(path: string): Promise<Buffer> {
        path = this.config.rootDir + path;

        return fs.promises.readFile(path)
            .catch((err) => {
                switch (err.code){
                    case 'ENOENT':
                        throw new Error('File does not exist (' + path + ')');
                    default:
                        throw err;
                }
            });
    }

    /**
     * Get path relative to the root directory
     * 
     * @param path Relative path
     * @returns Path prefixed with root directory
     */
    public getPath(path: string): string {
        return this.config.rootDir + path;
    }

    /**
     * Read ID3 meta tags from a file Buffer
     * 
     * @param buffer File Buffer
     * @returns Object containing metadata
     */
    public async getID3(buffer: Buffer): Promise<mm.IAudioMetadata> {
        return mm.parseBuffer(buffer);
    }
}