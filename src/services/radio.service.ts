import { IRadioConfig } from '../config';
import { getProviders } from '../app';
import { Radio, RadioTrack, Track, Playlist } from '../models';
import { Subject } from 'rxjs';

/**
 * Radio service
 * Holds state of active radios and continuosly manages their playlists
 */
export class RadioService {
    /**
     * Configuration of radio service
     */
    private config: IRadioConfig;

    /**
     * Array of active radios
     */
    private radios: Radio[];

    /**
     * Subject emiting on track change
     */
    private trackChangeSubject: Subject<Radio>;

    /**
     * Radio pooling holder
     */
    private pooling: NodeJS.Timeout;


    /**
     * Create radio service instance
     * @param config 
     */
    constructor(config: IRadioConfig) {
        this.config = config;
        this.trackChangeSubject = new Subject<Radio>();
    }

    /**
     * Load radios and start pooling
     * 
     * @returns Radio service
     */
    public async start(): Promise<RadioService> {
        this.radios = await this.loadRadios();
        this.checkAllRadioPlaylists();
        return this;
    }

    /**
     * Stop radios and disable pooling
     */
    public stop() {
        this.radios = [];
        clearTimeout(this.pooling);
    }

    /**
     * Get track change subject as observable
     * 
     * @returns Track change observable
     */
    public getTrackChange() {
        return this.trackChangeSubject.asObservable();
    }
    
    /**
     * Get active radio class by id
     * 
     * @param id Radio id
     * @returns Radio class
     */
    public getRadio(id: number): Radio {
        return this.radios.find((x) => x.playlistId === id);
    }

    /**
     * Get all active radio classes
     * 
     * @returs Array of radio classes
     */
    public getRadios(): Radio[] {
        return this.radios;
    }

    /**
     * Create radio from playlist and start playing
     * 
     * @async
     * @param playlist Playlist class
     * @returns Created radio class
     */
    public async createRadio(playlist: Playlist): Promise<Radio> {
        if (!playlist.id || this.getRadio(playlist.id))
            return;

        let radio = new Radio();
        radio.playlistId = playlist.id;
        radio.name = playlist.name;
        await getProviders().radio.insertRadio(radio);

        this.radios.push(radio);
    }

    /**
     * Update radio from playlist
     * 
     * @param playlist Playlist class
     * @returns Updated radio class
     */
    public async updateRadio(playlist: Playlist): Promise<Radio> {
        if (!playlist.id || !this.getRadio(playlist.id))
            return;

        let radio = this.getRadio(playlist.id);
        radio.name = playlist.name;
        await getProviders().radio.updateRadio(radio);
    }

    /** 
     * Delete radio by specific id
     * 
     * @param id Radio id
     */
    public async deleteRadio(id: number) {
        if (!this.getRadio(id))
            return;

        this.radios = this.radios.filter(x => x.playlistId != id);
        await getProviders().radio.deleteRadio(id);
    }

    /**
     * Load all radios from database
     * 
     * @async
     * @returns List of radios
     */
    private async loadRadios(): Promise<Radio[]> {
        const radios = await getProviders().radio.getAllRadios();
        await Promise.all(
            radios.map(x => {
                return getProviders().radio
                    .getRadioTracks(x.playlistId)
                    .then((tracks) => x.tracks = tracks);
            })
        );

        return radios;
    }

    /**
     * Check state of all playing radios and register next pooling tick
     * 
     * @async
     */
    private async checkAllRadioPlaylists() {
        await Promise.all(this.radios.map(radio => { 
            this.checkRadioPlaylist(radio);
        }));

        if (this.config.poolingInterval) {
            this.pooling = setTimeout(() => {
                this.checkAllRadioPlaylists()
            }, this.config.poolingInterval);
        }
    }

    /**
     * Check state of a specific radio.
     * Clean up previously played tracks, generate new tracks and report state
     * 
     * @async
     * @param radio Radio class
     */
    private async checkRadioPlaylist(radio: Radio) {
        let currentTrack = radio.getCurrentTrack();

        /**
         * Truncate finished tracks from the playlist
         * @todo Create a more elegant implementation for asynchronous array filtering
         */
        radio.tracks = (await Promise.all(
            radio.tracks.map(async (track) => {
                if (track.endTime < new Date()) {
                    await getProviders().radio.deleteRadioTrack(radio.playlistId, track.id);
                    return null;
                }
                return track;
            })
        )).filter(x => x != null);

        /**
         * Check playlist length and generate new tracks if necessary
         */
        if (radio.tracks.length < this.config.playlistLength) {
            let lastTrack = radio.getLastTrack();
            let lastTime = (lastTrack && lastTrack.endTime) ? lastTrack.endTime : new Date();

            // Get an array of new tracks for current radio
            const newTracks = await getProviders().playlist.getLeastPlayedPlaylistTracks(
                radio.playlistId,
                this.config.playlistLength - radio.tracks.length,
                new Date(lastTime.getTime() - this.config.minShuffleTimeout)
            );

            // Iterate over new tracks and add them to the radio playlist
            newTracks.map((track) => {
                if (!radio.tracks.find(x => x.id === track.id))
                {
                    let radioTrack = new RadioTrack();
                    radioTrack.startTime = lastTime;
                    radioTrack.endTime = new Date(lastTime.getTime() + track.duration);
                    radioTrack = Object.assign(radioTrack, { ...track as Track });
                    radio.tracks.push(radioTrack);
                    getProviders().radio.insertRadioTrack(radioTrack);
                    lastTime = radioTrack.endTime;

                    // Update play count and last played time of the track
                    getProviders().playlist.updateTrackPlays(radio.playlistId, radioTrack.id, radioTrack.startTime);
                }
            });
        }

        // If the current playing track changed, emit change through the trackChangeSubject
        if (radio.getCurrentTrack()) {
            if (!currentTrack || currentTrack.id !== radio.getCurrentTrack().id) {
                this.trackChangeSubject.next(radio);
            }
        }
    }
}