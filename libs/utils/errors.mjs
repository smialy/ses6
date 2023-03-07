function logError(error) {
    if (error && error.stack) {
        error = error.stack;
    }
    let message = `\n${error} \n\nNode.js ${process.version}\n`;
    console.log(message);
}

export function setupExceptionHandler() {
    process.on("uncaughtException", logError);
    process.on('unhandledRejection', logError);  // catch all promisess
}
