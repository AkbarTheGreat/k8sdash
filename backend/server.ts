import app from './app';
import debugModule from 'debug';
import http from 'http';

const debug = debugModule('backend:server');
const defaultPort = 3000;

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT);
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, returning the default in any edge cases.
 */

function normalizePort(val: string | undefined): number {
    if (!val) {
        return defaultPort;
    }

    var port = parseInt(val, 10);

    if (isNaN(port) || port <= 0) {
        return defaultPort;
    }

    // port number
    return port;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: Error) {
    console.error(error);
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    if (!addr) {
        // addr is empty or null, not sure what to do here, so just skip it.
        return;
    }
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
