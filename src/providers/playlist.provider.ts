import { DatabaseService } from '../services/database.service';
import { Playlist, PlaylistTrack } from '../models';
import { TrackProvider } from './track.provider';

/**
 * Playlist data provider
 */
export class PlaylistProvider {
    /**
     * Database connection link
     */
    private db: DatabaseService;

    /**
     * Create playlist data provider instance and save database connection link
     * 
     * @param db Database connection link
     */
    constructor(db: DatabaseService) {
        this.db = db;
    }
    
    /**
     * Load playlist data by specific id
     * 
     * @param id Playlist id
     * @returns Playlist object
     */
    public async getPlaylist(id: number): Promise<Playlist> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_playlists')
            .where({ id })
            .first();

        return PlaylistProvider.playlistTransformer(result, new Playlist());
    }

    /**
     * Store a new playlist and return updated playlist object with newly assigned id
     * 
     * @param playlist Playlist object
     * @returns Updated playlist object
     */
    public async insertPlaylist(playlist: Playlist): Promise<Playlist> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .table('chill_playlists')
            .insert({
                id: playlist.id,
                name: playlist.name,
                date: playlist.date,
            });
            
        playlist.id = result[0];
        return playlist;
    }

    /**
     * Update an existing playlist
     * 
     * @param playlist Playlist object
     * @returns Playlist object
     */
    public async updatePlaylist(playlist: Playlist): Promise<Playlist> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlists')
            .update({ 
                name: playlist.name,
                date: playlist.date,
            })
            .where({ id: playlist.id });
        
        return playlist;
    }

    /**
     * Delete an existing playlist
     * 
     * @param id Playlist id
     */
    public async deletePlaylist(id: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlists')
            .del()
            .where({ id });
    }

    /**
     * Load playlist track data by specific playlist and track id
     * 
     * @param playlistId Playlist id
     * @param trackId Track id
     * @returns PlaylistTrack object
     */
    public async getPlaylistTrack(playlistId: number, trackId: number): Promise<PlaylistTrack> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_playlist_tracks')
            .join('chill_tracks', 'track_id', 'id')
            .where({
                playlist_id: playlistId,
                track_id: trackId
            })
            .first();

        return PlaylistProvider.playlistTrackTransformer(result, new PlaylistTrack());
    }

    /**
     * Load all playlist tracks by specific playlist id
     * 
     * @param playlistId Playlist id
     * @returns List of playlistTrack objects
     */
    public async getPlaylistTracks(playlistId: number): Promise<PlaylistTrack[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_playlist_tracks')
            .join('chill_tracks', 'track_id', 'id')
            .where({ playlist_id: playlistId });

        return result.map((r) => PlaylistProvider.playlistTrackTransformer(r, new PlaylistTrack()));
    }

    /**
     * Load list of the least played playlist tracks by specific playlist id.
     * For further refining requires a number of tracks to return and limiting date of last play.
     * 
     * @param playlistId Playlist id
     * @param limit Number of tracks to return
     * @param lastPlayLimit Maximum date to which tracks are looked up
     * @returns List of playlistTrack objects
     */
    public async getLeastPlayedPlaylistTracks(playlistId: number, limit: number, lastPlayLimit: Date): Promise<PlaylistTrack[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_playlist_tracks')
            .join('chill_tracks', 'track_id', 'id')
            .where({ playlist_id: playlistId })
            .where((self) => { self.where('last_play', '<', lastPlayLimit).orWhereNull('last_play') })
            .orderBy('play_count', 'asc')
            .orderByRaw('RAND()')
            .limit(limit);
        return result.map((r) => PlaylistProvider.playlistTrackTransformer(r, new PlaylistTrack()));
    }

    /**
     * Store a new playlist track and return playlistTrack object
     * 
     * @param playlistTrack PlaylistTrack object
     * @returns PlaylistTrack object
     */
    public async insertPlaylistTrack(playlistTrack: PlaylistTrack): Promise<PlaylistTrack> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .insert({ 
                playlist_id: playlistTrack.playlistId,
                track_id: playlistTrack.id,
                pos: playlistTrack.pos
            });

        return playlistTrack;
    }

    /**
     * Update an existing playlist track
     * 
     * @param playlistTrack PlaylistTrack object
     * @returns PlaylistTrack object
     */
    public async updatePlaylistTrack(playlistTrack: PlaylistTrack): Promise<PlaylistTrack> {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .update({ 
                pos: playlistTrack.pos
            })
            .where({
                playlist_id: playlistTrack.playlistId,
                track_id: playlistTrack.id
            });

        return playlistTrack;
    }

    /**
     * Delete an existing playlist track
     * 
     * @param playlistId Playlist id
     * @param trackId Track id
     */
    public async deletePlaylistTrack(playlistId: number, trackId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .del()
            .where({
                playlist_id: playlistId,
                track_id: trackId
            });
    }

    /**
     * Delete all playlist tracks by specific playlist id
     * 
     * @param playlistId Playlist id
     */
    public async deletePlaylistTracksByPlaylistId(playlistId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .del()
            .where({
                playlist_id: playlistId,
            });
    }

    /**
     * Delete all playlist tracks by specific track id
     * 
     * @param trackId Track id
     */
    public async deletePlaylistTracksByTrackId(trackId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .del()
            .where({
                track_id: trackId
            });
    }

    /**
     * Update playlist track's last play date and increment play count
     * 
     * @param playlistId Playlist id
     * @param trackId Track id
     * @param lastPlay Last play date
     */
    public async updateTrackPlays(playlistId: number, trackId: number, lastPlay: Date) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .update({ 
                last_play: lastPlay
            })
            .increment('play_count')
            .where({ playlist_id: playlistId, track_id: trackId });
    }

    /**
     * Cast database row data to Playlist instance
     * 
     * @static
     * @param row Database row data
     * @param obj Playlist instance
     * @returns Updated playlist instance
     */
    public static playlistTransformer<T extends Playlist>(row: any, obj: T): T {
        if (row) {
            obj.id = row.id;
            obj.name = row.name;
            obj.date = row.date;
        }
        return obj;
    }

    /**
     * Cast database row data to PlaylistTrack instance
     * 
     * @static
     * @param row Database row data
     * @param obj PlaylistTrack instance
     * @returns PlaylistTrack instance
     */
    public static playlistTrackTransformer<T extends PlaylistTrack>(row: any, obj: T): T {
        if (row) {
            obj.playlistId = row.playlist_id;
            obj.pos = row.pos;
            obj.playCount = row.play_count;
            obj.lastPlay = row.last_play;
            TrackProvider.trackTransformer(row, obj);
        }
        return obj;
    }
}