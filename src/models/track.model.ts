export class Track {

    public id: number;

    public fileId: number;

    public artist: string;

    public title: string;

    public featured: string;

    public likes: number;

    public img: string;

    public duration: number;


    public getTrackName(): string {
        return this.artist + ' - ' + this.title;
    }

    public getFileUrl(): string {
        return '/mp3/' + this.id + '.mp3';
    }
}