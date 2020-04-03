import { DatabaseService } from '../services/database.service';
import { Track } from '../models';

/**
 * Track data provider
 */
export class TrackProvider {
    /**
     * Database connection link
     */
    private db: DatabaseService;

    /**
     * Create track data provider instance and save database connection link
     * 
     * @param db Database connection link
     */
    constructor(db: DatabaseService) {
        this.db = db;
    }

    /**
     * Load track data by specific id
     * 
     * @async
     * @param id Track id
     * @returns Track object
     */
    public async getTrack(id: number): Promise<Track> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_tracks')
            .where({ id })
            .first();

        return TrackProvider.trackTransformer(result, new Track());
    }

    /**
     * Store a new track and return updated track object with newly assigned id
     * 
     * @async
     * @param playlist Track object
     * @returns Updated track object
     */
    public async insertTrack(track: Track): Promise<Track> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .table('chill_tracks')
            .insert({
                id: track.id,
                file_id: track.fileId,
                artist: track.artist,
                title: track.title,
                featured: track.featured,
                likes: track.likes,
                img: track.img,
                duration: track.duration
            });
        
        track.id = result[0];
        return track;
    }

    /**
     * Update an existing track
     * 
     * @async
     * @param playlist Track object
     * @returns Track object
     */
    public async updateTrack(track: Track): Promise<Track> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_tracks')
            .update({ 
                artist: track.artist,
                title: track.title,
                featured: track.featured,
                likes: track.likes,
                img: track.img,
                duration: track.duration
            })
            .where({ id: track.id });
        
        return track;
    }

    /**
     * Cast database row data to Track instance
     * 
     * @static
     * @param row Database row data
     * @param obj Track instance
     * @returns Updated track instance
     */
    public static trackTransformer<T extends Track>(row: any, obj: T): T {
        if (row) {
            obj.id = row.id;
            obj.fileId = row.file_id;
            obj.artist = row.artist;
            obj.title = row.title;
            obj.featured = row.featured;
            obj.likes = row.likes;
            obj.img = row.img;
            obj.duration = row.duration;
        }
        return obj;
    }
}