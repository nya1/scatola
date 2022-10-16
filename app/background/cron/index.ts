/* eslint-disable import/first */
require('dotenv').config();

import { ImportFromSourceCron } from "./import";

const importCron = new ImportFromSourceCron();

// start cronjobs
importCron.importFromSource();
