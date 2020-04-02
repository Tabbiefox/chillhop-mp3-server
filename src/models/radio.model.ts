import { Track } from './track.model';

export class Radio {

    public playlistId: number;

    public name: string;

    public tracks: RadioTrack[] = [];


    public getCurrentTrack(): RadioTrack {
        if (this.tracks && this.tracks.length > 0)
            return this.tracks[0];
    }

    public getNextTrack(): RadioTrack {
        if (this.tracks && this.tracks.length > 1)
            return this.tracks[1];
    }

    public getLastTrack(): RadioTrack {
        if (this.tracks && this.tracks.length > 0)
            return this.tracks[this.tracks.length - 1];
    }
}

export class RadioTrack extends Track {
    
    public playlistId: number;

    public startTime: Date;

    public endTime: Date;


    public getPlayTime(): Date {
        if (this.startTime && this.endTime) {
            return new Date(Date.now() - this.startTime.getTime());
        }
    }

    public getRemainingTime(): Date {
        if (this.startTime && this.endTime) {
            return new Date(this.endTime.getTime() - Date.now());
        }
    }
}