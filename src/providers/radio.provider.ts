import { DatabaseService } from '../services/database.service';
import { Radio, RadioTrack } from '../models';
import { TrackProvider } from './track.provider';

/**
 * Radio data provider
 */
export class RadioProvider {
    /**
     * Database connection link
     */
    private db: DatabaseService;

    /**
     * Create radio data provider instance and save database connection link
     * 
     * @param db Database connection link
     */
    constructor(db: DatabaseService) {
        this.db = db;
    }

    /**
     * Load radio data by specific id
     * 
     * @param id Radio id
     * @returns Radio object
     */
    public async getRadio(id: number): Promise<Radio> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_radios')
            .where({ playlist_id: id })
            .first();

        return RadioProvider.radioTransformer(result, new Radio());
    }

    /**
     * Load a list of radios
     * 
     * @returns List of radio objects
     */
    public async getAllRadios(): Promise<Radio[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_radios');

        return result.map((r) => RadioProvider.radioTransformer(r, new Radio()));
    }

    /**
     * Store a new radio and return updated radio object with newly assigned id
     * 
     * @param playlist Radio object
     * @returns Updated radio object
     */
    public async insertRadio(radio: Radio): Promise<Radio> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_radios')
            .insert({ 
                playlist_id: radio.playlistId,
                name: radio.name
            });

        return radio;
    }

    /**
     * Update an existing radio
     * 
     * @param playlist Radio object
     * @returns Radio object
     */
    public async updateRadio(radio: Radio): Promise<Radio> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_radios')
            .update({ name: radio.name })
            .where({ playlist_id: radio.playlistId });

        return radio;
    }

    /**
     * Delete an existing radio
     * 
     * @param id Radio id
     */    
    public async deleteRadio(id: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_radios')
            .del()
            .where({
                playlist_id: id
            });
    }

    /**
     * Load all radio tracks by specific radio id
     * 
     * @param radioId Radio id
     * @returns List of radioTrack objects
     */
    public async getRadioTracks(radioId: number): Promise<RadioTrack[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_radio_tracks')
            .join('chill_tracks', 'track_id', 'id')
            .where({ playlist_id: radioId })
            .orderBy('start_time', 'asc');

        return result.map((r) => RadioProvider.radioTrackTransformer(r, new RadioTrack()));
    }

    /**
     * Store a new radio track and return radioTrack object
     * 
     * @param radioTrack RadioTrack object
     * @returns RadioTrack object
     */
    public async insertRadioTrack(radioTrack: RadioTrack): Promise<RadioTrack> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_radio_tracks')
            .insert({ 
                playlist_id: radioTrack.playlistId,
                track_id: radioTrack.id,
                start_time: radioTrack.startTime,
                end_time: radioTrack.endTime
            });

        return radioTrack;
    }

    /**
     * Delete an existing radio track
     * 
     * @param radioId Radio id
     * @param trackId Track id
     */
    public async deleteRadioTrack(radioId: number, trackId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_radio_tracks')
            .del()
            .where({
                playlist_id: radioId,
                track_id: trackId
            });
    }
    
    /**
     * Cast database row data to Radio instance
     * 
     * @static
     * @param row Database row data
     * @param obj Radio instance
     * @returns Updated radio instance
     */
    public static radioTransformer<T extends Radio>(row: any, obj: T): T {
        if (row) {
            obj.playlistId = row.playlist_id;
            obj.name = row.name;
        }
        return obj;
    }

    /**
     * Cast database row data to RadioTrack instance
     * 
     * @static
     * @param row Database row data
     * @param obj RadioTrack instance
     * @returns RadioTrack instance
     */
    public static radioTrackTransformer<T extends RadioTrack>(row: any, obj: T): T {
        if (row) {
            obj.playlistId = row.playlist_id;
            obj.startTime = row.start_time;
            obj.endTime = row.end_time;
            obj = TrackProvider.trackTransformer(row, obj);
        }
        return obj;
    }
}