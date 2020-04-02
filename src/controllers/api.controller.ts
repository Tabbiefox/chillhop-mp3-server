import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { getProviders, getServices } from '../app';
import { isObject, isEmpty } from '../helpers';
import { PlaylistTrack, Playlist, Track } from '../models';

export function getRadios(req: Request, res: Response, next: NextFunction) {
    const result = getServices().radio.getRadios();
    res.json(result.map((x) => ({
        playlist_id: x.playlistId,
        name: x.name
    })));
}

export function getPlaylist(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!id) {
        return next(createError(400, 'Id is not a number'));
    }

    const radio = getServices().radio.getRadio(id);
    if (!radio || radio.playlistId != id) {
        return next(createError(404, 'Radio id ' + id + ' does not exist'));
    }

    res.json(radio.tracks.map((x) => { 
        return {
            artists: x.artist || 'Unknown artist',
            title: x.title,
            featured: x.featured,
            likes: x.likes,
            startTime: x.startTime.getTime() / 1000, // Convert microtime to unix time
            date_to: x.endTime.getTime() / 1000, // Convert microtime to unix time
            duration: x.duration,
            track_id: x.id, 
            fileID: x.fileId,
            img: x.img
        };
    }));
}

export function getCurrentTrack(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!id) {
        return next(createError(400, 'Id is not a number'));
    }

    const radio = getServices().radio.getRadio(id);
    if (!radio || radio.playlistId != id) {
        return next(createError(404, 'Radio id ' + id + ' does not exist'));
    }

    const track = radio.getCurrentTrack();
    if (!track) {
        return next(createError(404, 'Radio id ' + id + ' is not playing any track'));
    }

    res.json({ 
        artists: track.artist,
        title: track.title,
        start_at: track.startTime.getTime() / 1000, // Convert microtime to unix time
        track_id: track.id,
        img: track.img
    });
}

export function getCurrentTrackText(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!id) {
        return next(createError(400, 'Id is not a number'));
    }

    const radio = getServices().radio.getRadio(id);
    if (!radio || radio.playlistId != id) {
        return next(createError(404, 'Radio id ' + id + ' does not exist'));
    }

    const track = radio.getCurrentTrack();
    res.type('text/plain').send(track.getTrackName());
}

export async function postUpdatePlaylist(req: Request, res: Response, next: NextFunction) {
    const data = req.body;
    if (!data || !isObject(data) || isEmpty(data)) {
        return next(createError(400, 'No POST data found'));
    }

    // Validate params for Playlist object
    let playlistId: number = ('playlist_id' in data) ? Number(data.playlist_id) : null;
    if (!playlistId) {
        return next(createError(422, 'No playlist ID specified'));
    }
    if (isNaN(playlistId)) {
        return next(createError(422, 'Invalid playlist ID specified'));
    }

    let title: string = ('title' in data) ? String(data.title) : null;
    if (!title) {
        return next(createError(422, 'No playlist title specified'));
    }

    let date: Date = ('date' in data) ? new Date(data.date) : null;
    if (!date) {
        return next(createError(422, 'No playlist date specified'));
    }
    if (isNaN(date.getTime())) {
        return next(createError(422, 'Invalid playlist date specified'));
    }

    // Create Playlist instance
    let playlist = new Playlist();
    playlist.id = playlistId;
    playlist.name = title;
    playlist.date = date;

    // Validate params for PlaylistTrack object
    let tracks: Array<any> = ('tracks' in data) ? data.tracks : null;
    if (!tracks) {
        return next(createError(422, 'No track array specified'));
    }
    if (!Array.isArray(tracks)) {
        return next(createError(422, 'Invalid track array specified'));
    }
    if (!tracks.length) {
        return next(createError(422, 'The track array is empty'));
    }

    // Insert PlaylistTrack objects into playlist instance
    try {
        playlist.tracks = tracks.map<PlaylistTrack>((x, i) => { 
            if (!x || !isObject(x) || isEmpty(x)) {
                throw createError(422, 'Unknown track data on position ' + i);
            }

            let trackId: number = ('trackid' in x) ? Number(x.trackid) : null;
            if (!trackId) {
                throw createError(422, 'No track ID specified on position ' + i);
            }
            if (isNaN(trackId)) {
                throw createError(422, 'Invalid track ID specified on position ' + i);
            }
    
            let pos: number = ('pos' in x && !isNaN(Number(x.pos))) ? Number(x.pos) : null;
    
            let track = new PlaylistTrack();
            track.playlistId = playlist.id;
            track.id = trackId;
            track.pos = pos;
    
            return track;
        });
    }
    catch(err) {
        return next(err);
    }

    // Get playlist data provider
    const db = getProviders().playlist;

    // Update existing playlist
    if ((await db.getPlaylist(playlistId)).id == playlistId) {
        await db.updatePlaylist(playlist);
        await saveTracks(playlist);

        // Update radio in the radio service
        await getServices().radio.updateRadio(playlist);
    }
    // Insert new playlist
    else {
        await db.insertPlaylist(playlist);
        await saveTracks(playlist);

        // Create new radio and register in the radio service
        await getServices().radio.createRadio(playlist);
    }

    // Save new tracks to playlist
    async function saveTracks(playlist) {
        return await Promise.all(playlist.tracks.map(async (track) => {
            return db.getPlaylistTrack(track.playlistId, track.id).then((result) => {
                if (result.playlistId != track.playlistId) {
                    return db.insertPlaylistTrack(track);
                }
            });
        }));
    }

    res.json({
        success: true
    });
}


/**
 * @todo: Parse missing img from ID3 (id3.common.picture[0].data: Buffer)
 */
export async function postTrack(req: Request, res: Response, next: NextFunction) {
    const data = req.body;
    if (!data || !isObject(data) || isEmpty(data)) {
        return next(createError(400, 'No POST data found'));
    }

    /**
     * Validate file contents and create buffer
     */
    let fileContents: Buffer = ('file_contents' in data) ? Buffer.from(data.file_contents, 'base64') : null;
    if (!fileContents) {
        return next(createError(422, 'No file contents specified'));
    }

    /**
     * Validate params for Track object
     */
    let id: number = ('id' in data) ? Number(data.id) : null;
    if (!id) {
        return next(createError(422, 'No track ID specified'));
    }
    if (isNaN(id)) {
        return next(createError(422, 'Invalid track ID specified'));
    }
    let fileId: number = ('file_id' in data) ? Number(data.file_id) : id;
    if (isNaN(id)) {
        return next(createError(422, 'Invalid file ID specified'));
    }
    let artist: string = ('artist' in data) ? String(data.artist) : null;
    let title: string = ('title' in data) ? String(data.title) : null;
    let featured: string = ('featured' in data) ? String(data.featured) : null;
    let img: string = ('img' in data) ? String(data.img) : null;
    let duration: number = ('duration' in data) ? Number(data.duration) : null;

    /**
     * Attempt to fill missing file info from ID3
     */
    const id3 = await getServices().storage.getID3(fileContents);
    artist = artist || ('artist' in id3.common) ? id3.common.artist : null;
    if (!artist) {
        return next(createError(422, 'Unable to determine track artist'));
    }
    title = artist || ('title' in id3.common) ? id3.common.title : null;
    if (!title) {
        return next(createError(422, 'Unable to determine track title'));
    }
    duration = duration || ('duration' in id3.format) ? id3.format.duration * 1000 : null;  // Convert ID3 duration to microtime
    if (!duration) {
        return next(createError(422, 'Unable to determine track duration'));
    }

    /**
     * Store track info to DB
     */
    let track = new Track();
    track.id = id;
    track.fileId = fileId;
    track.artist = artist;
    track.title = title;
    track.featured = featured;
    track.img = img;
    track.duration = duration;
    try {
        track = await getProviders().track.insertTrack(track)
    } catch(error) {
        return next(createError(500, 'Error occured while saving track info to database'));
    };

    /**
     * Store file contents
     */
    const storage = getServices().storage;
    const fileName = fileId + '.mp3';
    try {
        await storage.saveFile(fileName, fileContents);
    } catch(error) {
        console.log(error);
        return next(createError(500, 'Error occured while saving the file'));
    };

    res.json({
        success: true
    });
}