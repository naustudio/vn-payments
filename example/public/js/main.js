console.log('Nau Studio');

$(function() {
	$('.ui.radio.checkbox').checkbox();

	$('#amount-input').autoNumeric('init');
	$('.result__paying-info__value').autoNumeric('init');

	$('.ui .autofill-checkbox').on('change', function(e) {
		var isChecked = e.target.checked;
		var form = document.querySelectorAll('.form')[0].elements;

		if (isChecked) {
			form.firstname.value = 'Tú';
			form.lastname.value = 'Địch';
			form.billingStreet.value = '441 Cách Mạng Tháng Tám';
			form.billingCity.value = '10';
			form.billingCountry.value = 'VN';
			form.billingPostCode.value = '700000';
			form.billingStateProvince.value = 'Hồ Chí Minh';
			form.email.value = 'tu.nguyen@naustud.io';
			form.phoneNumber.value = '0999999999';
		} else {
			form.firstname.value = '';
			form.lastname.value = '';
			form.billingStreet.value = '';
			form.billingCountry.value = '';
			form.billingCity.value = '';
			form.billingPostCode.value = '';
			form.billingStateProvince.value = '';
			form.email.value = '';
			form.phoneNumber.value = '';
		}
	});
});
