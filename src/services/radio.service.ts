import { IRadioConfig } from '../config';
import { getProviders } from '../app';
import { Radio, RadioTrack, Track, Playlist } from '../models';
import { Subject } from 'rxjs';

export class RadioService {
    private config: IRadioConfig;

    private radios: Radio[];

    private radioChangeSubject: Subject<Radio>;

    private pooling: NodeJS.Timeout;


    constructor(config: IRadioConfig) {
        this.config = config;
        this.radioChangeSubject = new Subject<Radio>();
    }

    public async start(): Promise<RadioService> {
        this.radios = await this.loadRadios();
        this.checkAllRadioPlaylists();
        return this;
    }

    public stop() {
        this.radios = [];
        clearTimeout(this.pooling);
    }

    public getRadioChange() {
        return this.radioChangeSubject.asObservable();
    }
    
    public getRadio(id: number): Radio {
        return this.radios.find((x) => x.playlistId == id);
    }

    public getRadios(): Radio[] {
        return this.radios;
    }

    public async createRadio(playlist: Playlist): Promise<Radio> {
        if (!playlist.id || this.getRadio(playlist.id))
            return;

        let radio = new Radio();
        radio.playlistId = playlist.id;
        radio.name = playlist.name;
        await getProviders().radio.insertRadio(radio);

        this.radios.push(radio);
    }

    public async updateRadio(playlist: Playlist): Promise<Radio> {
        if (!playlist.id || !this.getRadio(playlist.id))
            return;

        let radio = this.getRadio(playlist.id);
        radio.name = playlist.name;
        await getProviders().radio.updateRadio(radio);
    }

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

    private async checkRadioPlaylist(radio: Radio): Promise<boolean> {
        let currentTrack = radio.getCurrentTrack();

        // Truncate finished tracks and awaits asynchronous result
        radio.tracks = (await Promise.all(
            radio.tracks.map(async (track) => {
                if (track.endTime < new Date()) {
                    await getProviders().radio.deleteRadioTrack(radio.playlistId, track.id);
                    return null;
                }
                return track;
            })
        )).filter(x => x != null);

        // Check playlist length and generate new tracks if necessary
        if (radio.tracks.length < this.config.playlistLength) {
            let lastTrack = radio.getLastTrack();
            let lastTime = (lastTrack && lastTrack.endTime) ? lastTrack.endTime : new Date();

            const newTracks = await getProviders().playlist.getLeastPlayedPlaylistTracks(
                radio.playlistId,
                this.config.playlistLength - radio.tracks.length,
                new Date(lastTime.getTime() - this.config.minShuffleTimeout)
            );

            newTracks.map((track) => {
                if (!radio.tracks.find((x) => { x.id == track.id }))
                {
                    let radioTrack = new RadioTrack();
                    radioTrack.startTime = lastTime;
                    radioTrack.endTime = new Date(lastTime.getTime() + track.duration);
                    radioTrack = Object.assign(radioTrack, { ...track as Track });
                    radio.tracks.push(radioTrack);
                    getProviders().radio.insertRadioTrack(radioTrack);
                    getProviders().playlist.updateTrackPlays(radio.playlistId, radioTrack.id, radioTrack.startTime);
                    lastTime = radioTrack.endTime;
                }
            });
        }

        // If the current track changed, report to the trackChangeSubject
        if (radio.getCurrentTrack()) {
            if (!currentTrack || currentTrack.id != radio.getCurrentTrack().id) {
                this.radioChangeSubject.next(radio);
                return true;
            }
        }

        return false;
    }
}