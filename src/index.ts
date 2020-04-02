import { config } from './config';
import * as App from './app';

/**
 * Asynchronous application bootstrap
 */
export async function init() {
    try {
        // Instantiate and register app services
        App.initServices(config);

        // Instantiate and configure web server
        const server = App.initServer(config);
        App.initServerRoutes(server);
        App.initServerErrorHandler(server);

        // Start radio server service
        const radioServer = App.getServices().radio;
        radioServer.start();

        // Hook a subscriber to the track change observable
        radioServer.getTrackChange().subscribe((radio) => {
            let currentTime = new Date();
            let currentTrack = radio.getCurrentTrack();
            let duration = new Date(currentTrack.duration);
            console.log(
                '(' + currentTime.toUTCString() + ') ' +
                'New track playing on ' + radio.name + ': ' +
                currentTrack.getTrackName() + 
                ' [' + duration.toTimeString().substr(3, 5) + ']');
        });

        // Start web server
        server.listen(Number(config.port) || 8080);
    }
    catch(e) {
        console.log(e, 'An error occured while initializing application');
    }
}

init();