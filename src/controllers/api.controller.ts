import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { getProviders, getServices } from '../app';
import { isObject, isEmpty } from '../helpers';
import { PlaylistTrack, Playlist, Track } from '../models';

/**
 * @api {get} /radios Request list of available radios
 * @apiName GetRadios
 * 
 * @apiSuccess {Object[]}   _root               List of radios.
 * @apiSuccess {Number}     _root.playlist_id   Playlist ID
 * @apiSuccess {String}     _root.name          Radio title
 * 
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          {
 *              "playlist_id": 1,
 *              "name": "Radio Playlist 1"
 *          },
 *          {
 *              "playlist_id": 2,
 *              "name": "Radio Playlist 2"
 *          }
 *      ]
 */
export function getRadios(req: Request, res: Response, next: NextFunction) {
    const result = getServices().radio.getRadios();
    res.json(result.map((x) => ({
        playlist_id: x.playlistId,
        name: x.name
    })));
}

/**
 * @api {get} /playlist/:id Request playlist of a specific radio
 * @apiName GetPlaylist
 * @apiParam {Number}   id    Playlist ID
 * 
 * @apiSuccess {Object[]}   _root               List of playlist tracks.
 * @apiSuccess {String}     _root.artists       Artist name
 * @apiSuccess {String}     _root.title         Track title
 * @apiSuccess {String}     _root.featured      Name of featured artist
 * @apiSuccess {Number}     _root.likes         Number of likes
 * @apiSuccess {Number}     _root.startTime     Playing start timestamp
 * @apiSuccess {Number}     _root.endTime       Playing end timestamp
 * @apiSuccess {Number}     _root.duration      Track duration timestamp
 * @apiSuccess {Number}     _root.track_id      Track ID
 * @apiSuccess {Number}     _root.fileID        File ID
 * @apiSuccess {String}     _root.img           URL of track image
 * 
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          {
 *              "artists": "Artist 1",
 *              "title": "Track 1",
 *              "featured": "Artist 2",
 *              "likes": 100,
 *              "startTime": 1585842247,
 *              "date_to": 1585842374,
 *              "duration": 126315,
 *              "track_id": 1199,
 *              "fileID": 1199,
 *              "img": "https://cms.chillhop.com/?serve&file=1199"
 *          }
 *      ]
 */
export function getPlaylist(req: Request, res: Response, next: NextFunction) {
    // Validate params
    if (!req.params.id) {
        return next(createError(400, 'No radio ID Specified'));
    }
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return next(createError(400, 'Invalid radio ID specified'));
    }

    // Load required radio
    const radio = getServices().radio.getRadio(id);
    if (!radio || radio.playlistId !== id) {
        return next(createError(404, 'Radio ID ' + id + ' does not exist'));
    }

    // Return list of radio tracks
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

/**
 * @api {get} /current_track/:id Request currently playing track of a specific radio
 * @apiName GetCurrentTrack
 * @apiParam {Number}   id    Playlist ID
 * 
 * @apiSuccess {String}     artists     Artist name
 * @apiSuccess {String}     title       Track title
 * @apiSuccess {Number}     start_at    Playing start timestamp
 * @apiSuccess {Number}     track_id    Track ID
 * @apiSuccess {String}     img         URL of track image
 * 
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "artists": "Artist 1",
 *          "title": "Track 1",
 *          "start_at": 1585842247,
 *          "track_id": 1199,
 *          "img": "https://cms.chillhop.com/?serve&file=1199"
 *      }
 */
export function getCurrentTrack(req: Request, res: Response, next: NextFunction) {
    // Validate params    
    if (!req.params.id) {
        return next(createError(400, 'No radio ID Specified'));
    }
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return next(createError(400, 'Invalid radio ID specified'));
    }

    // Load required radio and its current track
    const radio = getServices().radio.getRadio(id);
    if (!radio || radio.playlistId !== id) {
        return next(createError(404, 'Radio ID ' + id + ' does not exist'));
    }
    const track = radio.getCurrentTrack();
    if (!track) {
        return next(createError(404, 'Radio id ' + id + ' is not playing any track'));
    }

    // Return json
    res.json({ 
        artists: track.artist,
        title: track.title,
        start_at: track.startTime.getTime() / 1000, // Convert microtime to unix time
        track_id: track.id,
        img: track.img
    });
}

/**
 * @api {get} /current_track_text/:id Request currently playing track text of a specific radio
 * @apiName GetCurrentTrackText
 * @apiParam {Number}   id    Playlist ID
 * 
 * @apiSuccess 200 Track text
 * 
 * @apiSuccessExample {text/plain} Success-Response:
 *      HTTP/1.1 200 OK
 *      Artist 1 - Track 1
 */
export function getCurrentTrackText(req: Request, res: Response, next: NextFunction) {
    // Validate params
    if (!req.params.id) {
        return next(createError(400, 'No radio ID Specified'));
    }
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return next(createError(400, 'Invalid radio ID specified'));
    }

    // Load required radio and its current track
    const radio = getServices().radio.getRadio(id);
    if (!radio || radio.playlistId !== id) {
        return next(createError(404, 'Radio id ' + id + ' does not exist'));
    }
    const track = radio.getCurrentTrack();
    if (!track) {
        return next(createError(404, 'Radio id ' + id + ' is not playing any track'));
    }

    // Return track name in plan text
    res.type('text/plain').send(track.getTrackName());
}

/**
 * @api {post} /update_playlist Create or update a radio playlist
 * @apiName PostUpdatePlaylist
 * 
 * @apiParam {Number}   playlist_id     Playlist ID
 * @apiParam {String}   title           Playlist title
 * @apiParam {Date}     date            Playlist date
 * @apiParam {Object[]} tracks          List of playlist tracks
 * @apiParam {Number}   tracks.trackid  Track ID
 * @apiParam {Number}   tracks.pos      Track position
 * 
 * @apiParamExample {json} Request-Example:
 *      {
 *          "playlist_id": 1,
 *          "title": "Playlist 1",
 *          "date": 1585842247,
 *          "tracks": [
 *              {
 *                  "trackid": 1,
 *                  "pos": 1
 *              }
 *          ]
 *      }
 * 
 * @apiSuccess {Boolean}    success     Success boolean
 * 
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *      }
 */
export async function postUpdatePlaylist(req: Request, res: Response, next: NextFunction) {
    // Ensure POST data exists
    const data = req.body;
    if (!data || !isObject(data) || isEmpty(data)) {
        return next(createError(400, 'No POST data found'));
    }

    // Validate playlist params
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

    // Validate playlist tracks param
    let tracks: any[] = ('tracks' in data) ? data.tracks : null;
    if (!tracks) {
        return next(createError(422, 'No track array specified'));
    }
    if (!Array.isArray(tracks)) {
        return next(createError(422, 'Invalid track array specified'));
    }
    if (!tracks.length) {
        return next(createError(422, 'The track array is empty'));
    }

    // Validate each playlist track param and create playlistTrack instances
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
    if ((await db.getPlaylist(playlistId)).id === playlistId) {
        await db.updatePlaylist(playlist);
        await saveTracks(playlist.tracks);

        // Update radio in the radio service
        await getServices().radio.updateRadio(playlist);
    }
    // Insert new playlist
    else {
        await db.insertPlaylist(playlist);
        await saveTracks(playlist.tracks);

        // Create new radio and register in the radio service
        await getServices().radio.createRadio(playlist);
    }

    // Save new tracks to playlist
    async function saveTracks(playlistTracks: PlaylistTrack[]) {
        return await Promise.all(playlistTracks.map(async (track) => {
            return db.getPlaylistTrack(track.playlistId, track.id).then((result) => {
                if (result.playlistId !== track.playlistId) {
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
 * @api {post} /track Upload new track to the server
 * @apiName PostTrack
 * @apiDescription Api end-point for new track uploads.
 *                 File contents are to be Base64 encrypted.
 *                 Missing optional meta parameters will retrieved from ID3.
 * 
 * @apiParam {Number}   id              Track ID
 * @apiParam {Number}   [file_id]       (Optional) File ID
 * @apiParam {String}   [artist]        (Optional) Artist name
 * @apiParam {String}   [title]         (Optional) Track title
 * @apiParam {String}   [featured]      (Optional) Featured artist name
 * @apiParam {String}   [img]           (Optional) URL of track image
 * @apiParam {Number}   [duration]      (Optional) Track position
 * @apiParam {String}   file_contents   Base64 encoded file contents (max. 50mb)
 * 
 * @apiParamExample {json} Request-Example:
 *      {
 *          "id": 1,
 *          "file_id": 1,
 *          "artist": "Artist 1",
 *          "title": "Title 1",
 *          "featured": "Artist 2",
 *          "img": "https://cms.chillhop.com/?serve&file=1199",
 *          "duration": 192000,
 *          "file_contents": "SGVsbG8gd29ybGQ="
 *      }
 * 
 * @apiSuccess {Boolean}    success     Success boolean
 * 
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *      }
 * 
 * @todo: Parse missing img from ID3 (id3.common.picture[0].data: Buffer)
 */
export async function postTrack(req: Request, res: Response, next: NextFunction) {
    // Ensure POST data exists
    const data = req.body;
    if (!data || !isObject(data) || isEmpty(data)) {
        return next(createError(400, 'No POST data found'));
    }

    // Validate file contents param and create file Buffer
    let fileContents: Buffer = ('file_contents' in data) ? Buffer.from(data.file_contents, 'base64') : null;
    if (!fileContents) {
        return next(createError(422, 'No file contents specified'));
    }

    // Validate track params
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

    // Attempt to retrieve missing file metadata from ID3
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

    // Create track instance and store it into DB
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

    // Store file contents
    const storage = getServices().storage;
    const fileName = track.getFileName();
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