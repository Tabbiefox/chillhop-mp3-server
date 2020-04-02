/**
 * Import app configuration
 */
import { config } from './config';

/**
 * Import app initialization components
 */
import * as App from './app';
import { Playlist } from './models';

/**
 * Application bootstrap
 */
export async function init() {
    try {
        App.initServices(config);

        const server = App.initServer(config);
        App.initServerRoutes(server);
        App.initServerErrorHandler(server);
        App.initScheduledTasks();

        // Start radio server
        const radioServer = App.getServices().radio;
        radioServer.getRadioChange().subscribe((radio) => {
            let currentTime = new Date();
            let currentTrack = radio.getCurrentTrack();
            let duration = new Date(currentTrack.duration);
            console.log(
                '(' + currentTime.toUTCString() + ') ' +
                'New track playing on ' + radio.name + ': ' +
                currentTrack.getTrackName() + 
                ' [' + duration.toTimeString().substr(3, 5) + ']');
        })
        radioServer.start();

        // Start web server
        server.listen(Number(config.port) || 8080);
    }
    catch(e) {
        console.log(e, 'An error occured while initializing application');
    }
}

init();