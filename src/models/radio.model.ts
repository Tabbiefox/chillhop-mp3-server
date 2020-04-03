import { Track } from './track.model';

/**
 * Radio model
 */
export class Radio {
    /**
     * Playlist id
     */
    public playlistId: number;

    /**
     * Radio title
     */
    public name: string;

    /**
     * List of radio tracks
     */
    public tracks: RadioTrack[] = [];

    /**
     * Return the currently playing track
     * 
     * @returns RadioTrack instance
     */
    public getCurrentTrack(): RadioTrack {
        if (this.tracks && this.tracks.length > 0)
            return this.tracks[0];
    }

    /**
     * Return the upcoming track
     * 
     * @returns RadioTrack instance
     */
    public getNextTrack(): RadioTrack {
        if (this.tracks && this.tracks.length > 1)
            return this.tracks[1];
    }

    /**
     * Return last track in the list
     * 
     * @returns RadioTrack instance
     */
    public getLastTrack(): RadioTrack {
        if (this.tracks && this.tracks.length > 0)
            return this.tracks[this.tracks.length - 1];
    }
}


/**
 * RadioTrack model
 * 
 * @extends Track Basic track model
 */
export class RadioTrack extends Track {
    /**
     * Playlist id
     */
    public playlistId: number;

    /**
     * Start playing date
     */
    public startTime: Date;

    /**
     * End playing date
     */
    public endTime: Date;

    /**
     * Return current playtime
     * 
     * @return Current playtime Date
     */
    public getPlayTime(): Date {
        if (this.startTime && this.endTime) {
            return new Date(Date.now() - this.startTime.getTime());
        }
    }

    /**
     * Return remaining playtime
     * 
     * @return Remaining playtime Date
     */
    public getRemainingTime(): Date {
        if (this.startTime && this.endTime) {
            return new Date(this.endTime.getTime() - Date.now());
        }
    }
}