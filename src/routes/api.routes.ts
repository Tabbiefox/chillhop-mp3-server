import { Router } from 'express';
import * as ApiController from '../controllers/api.controller';

/**
 * Definition of exposed API routes
 */
const ApiRouter = Router();
ApiRouter.get('/radios', async (req, res, next) => await ApiController.getRadios(req, res, next));
ApiRouter.get('/playlist/:id?', async (req, res, next) => await ApiController.getPlaylist(req, res, next));
ApiRouter.get('/current_track/:id?', async (req, res, next) => await ApiController.getCurrentTrack(req, res, next));
ApiRouter.get('/current_track_text/:id?', async (req, res, next) => await ApiController.getCurrentTrackText(req, res, next));
ApiRouter.post('/update_playlist', async (req, res, next) => await ApiController.postUpdatePlaylist(req, res, next));
ApiRouter.post('/track', async (req, res, next) => await ApiController.postTrack(req, res, next));

export default ApiRouter;