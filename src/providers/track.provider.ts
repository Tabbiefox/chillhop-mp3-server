import { DatabaseService } from '../services/database.service';
import { Track } from '../models';

export class TrackProvider {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    public async getTrack(id: number): Promise<Track> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_tracks')
            .where({ id })
            .first();

        return TrackProvider.trackTransformer(result, new Track());
    }

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
     * Static method that transforms database row data to Track object
     * 
     * @static
     * @param row Source data
     * @param obj Destination object of type Track
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