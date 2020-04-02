import { DatabaseService } from '../services/database.service';
import { Radio, RadioTrack } from '../models';
import { TrackProvider } from './track.provider';

export class RadioProvider {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    public async getRadio(id: number): Promise<Radio> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_radios')
            .where({ playlist_id: id })
            .first();

        return RadioProvider.radioTransformer(result, new Radio());
    }

    public async getAllRadios(): Promise<Radio[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_radios');

        return result.map((r) => RadioProvider.radioTransformer(r, new Radio()));
    }

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

    public async updateRadio(radio: Radio): Promise<Radio> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_radios')
            .update({ name: radio.name })
            .where({ playlist_id: radio.playlistId });

        return radio;
    }

    public async getRadioTracks(id: number): Promise<RadioTrack[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_radio_tracks')
            .join('chill_tracks', 'track_id', 'id')
            .where({ playlist_id: id })
            .orderBy('start_time', 'asc');

        return result.map((r) => RadioProvider.radioTrackTransformer(r, new RadioTrack()));
    }

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

    public async deleteRadioTrack(playlistId: number, trackId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_radio_tracks')
            .del()
            .where({
                playlist_id: playlistId,
                track_id: trackId
            });
    }
    
    /**
     * Static method that transforms database row data to Radio object
     * 
     * @static
     * @param row Source data
     * @param obj Destination object of type Radio
     */
    public static radioTransformer<T extends Radio>(row: any, obj: T): T {
        if (row) {
            obj.playlistId = row.playlist_id;
            obj.name = row.name;
        }
        return obj;
    }

    /**
     * Static method that transforms database row data to RadioTrack object
     * 
     * @static
     * @param row Source data
     * @param obj Destination object of type RadioTrack
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