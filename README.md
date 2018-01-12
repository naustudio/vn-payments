# vn-payments
[![Travis CI build status](https://travis-ci.org/naustudio/node-vn-payments.svg?branch=develop "Travis CI build status")](https://travis-ci.org/naustudio/node-vn-payments)
[![codecov](https://codecov.io/gh/naustudio/node-vn-payments/branch/develop/graph/badge.svg)](https://codecov.io/gh/naustudio/node-vn-payments)


## Getting started

```sh
# Clone the project
git clone git@github.com:vmasto/express-babel.git
cd express-babel

# Make it your own
rm -rf .git && git init && npm init

# Install dependencies
npm install

# or if you're using Yarn
yarn
```
Then you can begin development:

```sh
# yarn
yarn run dev

# npm
npm run dev
```

This will launch a [nodemon](https://nodemon.io/) process for automatic server restarts when your code changes.

### Testing

Testing is powered by [Jest](https://facebook.github.io/jest/). This project also uses [supertest](https://github.com/visionmedia/supertest) for demonstrating a simple routing smoke test suite. Feel free to remove supertest entirely if you don't wish to use it.

Start the test runner in watch mode with:

```sh
# yarn
yarn test

# npm
npm test
```

You can also generate coverage with:

```sh
# yarn
yarn test --coverage

# npm
npm test --coverage
```

### Linting

Linting is set up using [ESLint](http://eslint.org/). It uses ESLint's default [eslint:recommended](https://github.com/eslint/eslint/blob/master/conf/eslint.json) rules. Feel free to use your own rules and/or extend another popular linting config (e.g. [airbnb's](https://www.npmjs.com/package/eslint-config-airbnb) or [standard](https://github.com/feross/eslint-config-standard)).

Begin linting in watch mode with:

```sh
# yarn
yarn run lint

# npm
npm run lint
```

To begin linting and start the server simultaneously, edit the `package.json` like this:

```
"dev": "nodemon src/index.js --exec \"node -r dotenv/config -r babel-register\" | npm run lint"
```

### Environmental variables in development

The project uses [dotenv](https://www.npmjs.com/package/dotenv) for setting environmental variables during development. Simply copy `.env.example`, rename it to `.env` and add your env vars as you see fit.

It is **strongly** recommended **never** to check in your .env file to version control. It should only include environment-specific values such as database passwords or API keys used in development. Your production env variables should be different and be set differently depending on your hosting solution. `dotenv` is only for development.

### Deployment

Deployment is specific to hosting platform/provider but generally:

```sh
# yarn
yarn run build

# npm
npm run build
```

will compile your `src` into `/dist`, and

```sh
# yarn
yarn start

# npm
npm start
```

will run `build` (via the `prestart` hook) and start the compiled application from the `/dist` folder.

The last command is generally what most hosting providers use to start your application when deployed, so it should take care of everything.

You can find small guides for Heroku, App Engine and AWS in [the deployment](DEPLOYMENT.md) document.

## FAQ

## Thanks

- The Express app was based on [Express Babel Starter Kit](https://github.com/vmasto/express-babel) by [@vmasto](https://github.com/vmasto)

## License

Copyright 2018 Nau Studio <https://naustud.io>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

VNPay Test account

Thông tin thẻ test (Chọn Ngân hàng NCB để thanh toán)
-           Số thẻ: 9704198526191432198
-           Tên chủ thẻ: NGUYEN VAN A
-           Ngày phát hành: 07/15
-           Mật khẩu OTP mặc định: 123456
