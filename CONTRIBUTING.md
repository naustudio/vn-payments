# CONTRIBUTING

Thanks for your interest in **vn-payments** development. We welcome any kind of contributions to this project.

If you have issues to report, it's best to write down a unit test (using Jest) and post the issue ticket with a PR to your unit test.

If you want to contribute with new feature and fixes, please read below guidelines first:

## Code standards:

* Please follow Nau Studio's [JavaScript code styles](https://github.com/naustudio/javascript). Hint: we follow mostly AirBnB styles with exception of hard TABS as indentation characters.
* [ESlint](https://eslint.org/) must be used to validate your code before submitting PR.
* [Prettier](https://prettier.io/) must be used with your code editor to maintain code standards.

## Getting Started with Development:

* Install Node.
* Clone source code to your machine.
* In the project root folder, execute command in terminal: `npm install`.
* Change to `example/` folder, execute command : `npm install`.
* Start the example from project root with: `npm start`.
  This will launch a [nodemon](https://nodemon.io/) process for automatic server restarts when your code changes.

### Testing

Testing is powered by [Jest](https://facebook.github.io/jest/). This project also uses [supertest](https://github.com/visionmedia/supertest) for demonstrating a simple routing smoke test suite.

<!-- TODO: consider removing supertest if not use -->

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

## Add more Payment Gateway:

[TBC]

## Documentation

* Comment code following [JSDoc](http://usejsdoc.org/) specifications.
* From terminal, execute command to generate new documentation site:

```sh
# yarn
yarn doc
# npm
npm run doc
```

## Testing cards for payment tests

### OnePay Domestic Test card:

* Type of card: Vietcombank – Connect24
* Card Name: NGUYEN HONG NHUNG
* Card Number: 6868682607535021
* Issue date: 12/08

### OnePay International Test cards:

Card 1 – Credit card – Successful transaction Card type:

* Visa Number: 4005550000000001
* Date Exp: 05/21
* CVV/CSC: 123

Card 2 – Credit card: return B, F, E code – Fail transaction

* Number: 5313581000123430
* Date Exp: 05/21
* CVV/CSC: 123

### VNPay Test cards

Thông tin thẻ test (Chọn Ngân hàng NCB để thanh toán)

* Số thẻ: 9704198526191432198
* Tên chủ thẻ: NGUYEN VAN A
* Ngày phát hành: 07/15
* Mật khẩu OTP mặc định: 123456

### NganLuong Test cards

Thanh toán bằng ATM Online: chọn ngân hàng Bắc Á bank với thông tin thẻ:

* Số thẻ: 9874563254178962
* Họ tên chủ thẻ: Nguyen Hue
* Ngày phát hành: 10/2016
* Mã OTP: 123456

Thanh toán bằng Internet banking: chọn ngân hàng BIDV với thông tin thẻ:

* Số tài khoản: 9874563254178962
* Họ tên chủ thẻ: Nguyen Hue
* Mật khẩu giao dịch tại ngân hàng: 123456
* Ngày phát hành: 10/2016
* Mã OTP: 123456

Thanh toán bằng thẻ visa, với thông tin thẻ:

* Số thẻ: 4444003254178962
* Họ tên chủ thẻ: Nguyen Hue
* Ngày hết hạn: 10/2023
* Mã CVV: 123
* Mã OTP: 123456

### SohaPay

(outdated, we need to contact SohaPay gateway support to get latest test card)

* Loai the: VISA
* So the: 4005550000000001
* Expire date: 05 - 13
* Security code (CSC/CVV): 234
* Ten: Tran Quang Khai

The cao dien thoai

* 12345671234567 (100k)
* 123456712345678 (50k)
