import { DatabaseService } from '../services/database.service';
import { Playlist, PlaylistTrack } from '../models';
import { TrackProvider } from './track.provider';

export class PlaylistProvider {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }
    
    public async getPlaylist(id: number): Promise<Playlist> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_playlists')
            .where({ id })
            .first();

        return PlaylistProvider.playlistTransformer(result, new Playlist());
    }

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

    public async deletePlaylist(id: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlists')
            .del()
            .where({ id: id });
    }

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

    public async getPlaylistTracks(playlistId: number): Promise<PlaylistTrack[]> {
        const dbc = await this.db.getConnection();
        const result = await dbc
            .select()
            .from('chill_playlist_tracks')
            .join('chill_tracks', 'track_id', 'id')
            .where({ playlist_id: playlistId });

        return result.map((r) => PlaylistProvider.playlistTrackTransformer(r, new PlaylistTrack()));
    }

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

    public async deletePlaylistTracksByPlaylistId(playlistId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .del()
            .where({
                playlist_id: playlistId,
            });
    }

    public async deletePlaylistTracksByTrackId(trackId: number) {
        const dbc = await this.db.getConnection();
        await dbc
            .table('chill_playlist_tracks')
            .del()
            .where({
                track_id: trackId
            });
    }

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
     * Static method that transforms database row data to playlist object
     * 
     * @static
     * @param row Source data
     * @param obj Destination object of type Playlist
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
     * Static method that transforms database row data to playlistTrack object
     * 
     * @static
     * @param row Source data
     * @param obj Destination object of type PlaylistTrack
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