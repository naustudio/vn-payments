import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import logger from 'morgan';
import bodyParser from 'body-parser';
import routes from './routes';

const app = express();
app.disable('x-powered-by');

// fix views folder location
app.set('views', path.join(__dirname, './views'));
// View engine setup
const hbs = exphbs.create({
	extname: '.hbs',
	defaultLayout: 'default',
	layoutsDir: path.join(__dirname, './views/layouts'),
	// Specify helpers which are only registered on this instance.
	// helpers: {
	// 		foo: function () { return 'FOO!'; },
	// 		bar: function () { return 'BAR!'; }
	// }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(
	logger('dev', {
		skip: () => app.get('env') === 'test',
	})
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './public')));

// Routes
app.use('/', routes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	res.status(err.status || 500).render('error', {
		message: err.message,
	});
});

export default app;
