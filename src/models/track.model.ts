/**
 * Track model
 */
export class Track {
    /**
     * Track id
     */
    public id: number;

    /**
     * Track file id
     */
    public fileId: number;

    /**
     * Artist name
     */
    public artist: string;

    /**
     * Track title
     */
    public title: string;

    /**
     * Featured artist name
     */
    public featured: string;

    /**
     * Number of likes
     */
    public likes: number;

    /**
     * Url to track image
     */
    public img: string;

    /**
     * Track duration in ms
     */
    public duration: number;

    /**
     * Return track artist name and title
     * 
     * @return Track artist name and title
     */
    public getTrackName(): string {
        return this.artist + ' - ' + this.title;
    }

    /**
     * Get track file name
     * 
     * @return Track file nama
     */
    public getFileName(): string {
        return this.fileId + '.mp3';
    }
}