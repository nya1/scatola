/* eslint-disable import/first */
require("dotenv").config();

import { ImportFromSourceCron } from "./import";

const importCron = new ImportFromSourceCron();

// start cronjobs
importCron.start();

function exitHandler(options: any, exitCode: number) {
  importCron.stop();

  if (options.exit) process.exit();
}

// do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
