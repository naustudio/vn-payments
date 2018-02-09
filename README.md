# vn-payments

[![By Nau Studio](https://img.shields.io/badge/By-Nau%20Studio-977857.svg)](https://naustud.io)
[![Travis CI build status](https://img.shields.io/travis/naustudio/node-vn-payments.svg)](https://travis-ci.org/naustudio/node-vn-payments/)
[![Code coverage status](https://img.shields.io/codecov/c/github/naustudio/node-vn-payments.svg)](https://codecov.io/gh/naustudio/node-vn-payments)
[![npm version](https://img.shields.io/npm/v/vn-payments.svg)](https://www.npmjs.com/package/vn-payments)
[![GitHub license](https://img.shields.io/github/license/naustudio/node-vn-payments.svg)](https://github.com/naustudio/node-vn-payments/blob/master/LICENSE)

Vietnam payment gateway helpers for NodeJS. Check out live demo [here](https://vn-payments-demo.now.sh).

_Thư viện hỗ trợ xây dựng URL tương tác với các cổng thanh toán trực tuyến ở Việt Nam._

> From our experience doing NodeJS e-commerce website in Vietnam, implementing online payment process is often troublesome and error-prone due to strict hashing algorithm and uncertain remote request rejections.
> Besides, many payment gateways in Vietnam don't have sample code or SDK for server-side JavaScript (yet). Therefore, we have gathered a set of JavaScript classes (written in ES6) that help NodeJS apps exchange data with payment gateways with more confidence and ease by validating payload object and normalize multiple gateways specs into a common API.

## Supported Payment Gateways

_Các cổng thanh toán đang được hỗ trợ_

* [OnePay](http://onepay.com.vn/) (Domestic & International)
* [VNPay](https://vnpay.vn/)
* [SohaPay](https://sohapay.vn/)
* [NganLuong](https://www.nganluong.vn/nganluong/home.html)

#### Planned gateways:

_Các cổng thanh toán dự định hỗ trợ:_

* 123Pay (chúng tôi chưa có tài liệu tích hợp, [bạn có thể giúp](https://github.com/naustudio/node-vn-payments/blob/master/CONTRIBUTING.md#add-more-payment-gateway)?)
* ~~AlePay~~ (AlePay chỉ hỗ trợ phương thức recurrent/subscription)

## Install

```sh
# npm
npm install vn-payments --save
# yarn
yarn add vn-payments
```

## Usage

### Payment Workflow:

Below is sequence diagram of typical payment gateway process:

_Bên dưới là sequence diagram minh họa quy trình thanh toán trực tuyến tiêu biểu:_

![Typical payment gateway process](https://raw.githubusercontent.com/naustudio/node-vn-payments/master/docs/payment-gateway-process.jpg)

<p align="center"><em>Diagram taken from OnePay Intl documentation</em></p>

**`vn-payments`** provides helper classes that build URL for _DO request_ and verify _DR Response_ for supported payment gateway.

Currently we haven't implemented the _QueryQR()_ functions. It is in our road map for next release.

_**`vn-payments`** cung cấp các class giúp xây dựng URL với tham số mã hóa để thực hiện "DO request" và
giúp kiểm tra "DR Response" trả về từ cổng thanh toán._

_Hiện tại chúng tôi chưa hiện thực chức năng "QueryDR"._

### JavaScript sample code:

Import one of the payment gateway class from `vn-payments`:

_Đầu tiên, import các class hỗ trợ thanh toán:_

```js
// ESM
import { OnePayDomestic } from 'vn-payments';
import { OnePayInternational } from 'vn-payments';
import { VNPay } from 'vn-payments';
import { SohaPay } from 'vn-payments';
import { NganLuong } from 'vn-payments';
// CommonJS
const { OnePayDomestic } = require('vn-payments');
const { OnePayInternational } = require('vn-payments');
const { VNPay } = require('vn-payments');
const { SohaPay } = require('vn-payments');
const { NganLuong } = require('vn-payments');
```

Instantiate the helper with merchant configs provided from the payment provider:

_Tiếp theo, khởi tạo instance của các class thanh toán với thông tin thiết lập dành riêng cho merchant
được cung cấp bởi cổng thanh toán:_

```js
const onepayIntl = new OnePayInternational({
  paymentGateway: 'https://mtf.onepay.vn/vpcpay/vpcpay.op',
  merchant: 'TESTONEPAY',
  accessCode: '6BEB2546',
  secureSecret: '6D0870CDE5F24F34F3915FB0045120DB',
});
```

Build checkout URL by passing checkout data to **buildCheckoutUrl** method. The checkout data is a structured object and will be validated with **GatewayClass.checkoutSchema** which is an instance of [`simpl-schema`](https://github.com/aldeed/simple-schema-js).

Checkout URL is an instance of so-called [WHATWG URL](https://nodejs.org/api/url.html#url_url), which assist parsing URL string into parts.

Then, redirect client to payment gateway's checkout handler:

_Xây dựng URL chuyển đến cổng thanh toán bằng hàm **buildCheckoutUrl**. Dữ liệu truyền vào là một object có cấu trúc được định nghĩa sẵn bởi thư viện và sẽ được kiểm tra hợp lệ bởi **GatewayClass.checkoutSchema**. Hàm **buildCheckoutUrl** sẽ trả về Promise bất đồng bộ, khi hoàn tất, sẽ trả về một [WHATWG URL](https://nodejs.org/api/url.html#url_url). Sau khi có được URL checkout, redirect trình duyệt của khách qua URL này:_

```js
routes.post('/payment/checkout', (req, res) => {
  const params = Object.assign({}, req.body);

  // construct checkout payload from form data and app's defaults
  const checkoutData = {
    amount: parseInt(params.amount, 10),
    customerId: params.email,
    currency: 'VND',
    /*...*/
  };

  // buildCheckoutUrl is async operation and will return a Promise
  onepayIntl
    .buildCheckoutUrl(checkoutData)
    .then(checkoutUrl => {
      res.writeHead(301, { Location: checkoutUrl.href });
      res.end();
    })
    .catch(err => {
      res.send(err);
    });
});
```

Finally, handle payment gateway callback. One of the requirements is that the callback query parameters must be validated with the checksum sent along:

_Cuối cùng, bạn sẽ cần xử lý URL callback từ cổng thanh toán. Một trong các yêu cầu đó là các tham số trong URL query trả về phải được kiểm tra tính hợp lệ với chuỗi mã hóa đính kèm:_

```js
routes.get('/payment/callback', (req, res) => {
  const query = req.query;

  onepayIntl.verifyReturnUrl(query).then(results => {
    if (results.isSucceed) {
      res.render('success', {
        title: 'Nau Store - Thank You',
        orderId: results.orderId,
        price: results.price,
        message: results.message,
      });
    } else {
      res.render('errors', {
        title: 'Nau Store - Payment Errors',
        message: results.message,
      });
    }
  });
});
```

For **IPN Request** to Website's Back End from Gateway server, implement another route handler according Gateway documentation and use the `verifyReturnUrl` to validate parameters sent from Gateway.

_Về việc xử lý **IPN Request** gửi trực tiếp đến backend của trang bán hàng, bạn cần hiện thực một route handler theo tài liệu hướng dẫn của cổng thanh toán và sử dụng lại hàm `verifyReturnUrl` để kiểm tra tính hợp lệ của request gửi từ cổng thanh toán._

## Example ([Live Demo](https://vn-payments-demo.now.sh))

See the Express checkout cart in the **example** folder.

#### Example Getting Started:

* Clone this repository.
* Run `npm install` in `example` folder
* Inside `example` folder, execute: `npm start`

#### Test cards for testing out example:

See testing cards info in [CONTRIBUTING.md](https://github.com/naustudio/node-vn-payments/blob/master/CONTRIBUTING.md#testing-cards-for-payment-tests)

## API Document

See [documentation](http://code.naustud.io/node-vn-payments).

## Contributing

Interested in contributing to this project? See [CONTRIBUTING.md](https://github.com/naustudio/node-vn-payments/blob/master/CONTRIBUTING.md)

## Road Map

* [x] Implement `buildCheckoutUrl` (A.K.A. `DO Request`) for OnePay, VNPay, SohaPay, NganLuong
* [x] Implement `verifyReturnUrl` (A.K.A. `DR Response`) for OnePay, VNPay, SohaPay, NganLuong
* [ ] Implement `queryDR` methods for existing gateways
* [ ] Implement helper class for **AlePay**
* [ ] Implement helper class for **123Pay**

## FAQ

[TBC]

## Thanks

* [Express starter kit](https://github.com/vmasto/express-babel) for the checkout cart example.
* Vietnam payment gateway's developers who worked with Nau Studio in preliminary projects that allows us make sure this code work.

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
