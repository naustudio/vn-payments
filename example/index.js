/**
 * Notice the use of @std/esm which allow us to use ESM right now without transpiling js files or babel-register
 * Read more: https://blogs.windows.com/msedgedev/2017/08/10/es-modules-node-today/
 */
/* eslint-disable import/first, no-global-assign */
require = require('@std/esm')(module, true);

const app = require('./app').default;

const { PORT = 8080 } = process.env;
// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
