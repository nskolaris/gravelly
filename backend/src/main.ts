import express from 'express';
// import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import jetpack from 'fs-jetpack';

import Routes from './structures/routes';

const server = express();

const start = async () => {
	// server.use(helmet());
	server.use(cors());
	server.use(morgan('dev'));
	server.use(express.urlencoded({ extended: true }));
	server.use(express.json());

	// Scan and load routes into express
	await Routes.load(server);
	server.listen(process.env.port, () => {
		console.log(`> Gravelly Server started on port ${process.env.port ?? 5000}.`);
	});

	jetpack.dir('uploads/images');
	server.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));
};

void start();
