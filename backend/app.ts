import express from 'express';
import logger from 'morgan';

import apiRouter from './routes/restv1';

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.static(__dirname + "/frontend"));
app.use('/api/v1', apiRouter);

export default app;

