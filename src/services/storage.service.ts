import { IStorageConfig } from '../config';
import * as mm from 'music-metadata';
import * as fs from 'fs';

export class StorageService {
    private config: IStorageConfig;

    constructor (config: IStorageConfig) {
        this.config = config;
        this.ensureDirExistsSync('');
    }

    public ensureDirExistsSync(path: string) {
        path = this.config.rootDir + path;

        if (path && !fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    }

    public async ensureDirExists(path: string): Promise<void> {
        path = this.config.rootDir + path;

        if (path && !fs.existsSync(path)) {
            return fs.promises.mkdir(path, { recursive: true });
        }
    }

    public async saveFile(path: string, data: Buffer) {
        path = this.config.rootDir + path;
        
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

    public async getID3(buffer: Buffer): Promise<mm.IAudioMetadata> {
        return mm.parseBuffer(buffer);
    }
}