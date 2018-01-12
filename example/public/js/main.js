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
			form.address.value = '441 Cách Mạng Tháng Tám';
			form.district.value = '10';
			form.ward.value = '13';
			form.city.value = 'Hồ Chí Minh';
			form.email.value = 'tu.nguyen@naustud.io';
			form.phoneNumber.value = '0999999999';
		} else {
			form.firstname.value = '';
			form.lastname.value = '';
			form.address.value = '';
			form.district.value = '';
			form.ward.value = '';
			form.city.value = '';
			form.email.value = '';
			form.phoneNumber.value = '';
		}
	});
});
