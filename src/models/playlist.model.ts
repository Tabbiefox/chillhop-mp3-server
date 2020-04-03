import { Track } from './track.model';

/**
 * Playlist model
 */
export class Playlist {
    /**
     * Playlist id
     */
    public id: number;

    /**
     * Playlist title
     */
    public name: string;

    /**
     * Playlist date
     */
    public date: Date;

    /**
     * List of playlist tracks
     */
    public tracks: PlaylistTrack[] = [];
}


/**
 * PlaylistTrack model
 * 
 * @extends Track Extends basic track model
 */
export class PlaylistTrack extends Track {
    /**
     * Playlist id
     */
    public playlistId: number;

    /**
     * Track position in playlist
     */
    public pos: number;

    /**
     * Number of plays in playlist
     */
    public playCount: number;

    /**
     * Last play date in playlist
     */
    public lastPlay: Date;
}