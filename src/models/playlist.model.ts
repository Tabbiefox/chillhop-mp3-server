import { Track } from './track.model';

export class Playlist {

    public id: number;

    public name: string;

    public date: Date;

    public tracks: PlaylistTrack[] = [];
}

export class PlaylistTrack extends Track {
    
    public playlistId: number;

    public pos: number;

    public playCount: number;

    public lastPlay: Date;
}