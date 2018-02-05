console.log('Nau Studio');

$(function() {
	$('.ui.radio.checkbox').checkbox();

	$('#amount-input').autoNumeric('init');
	$('.result__paying-info__value').autoNumeric('init');

	$('.ui .autofill-checkbox').on('change', function(e) {
		var isChecked = e.target.checked;
		var form = document.querySelectorAll('.form')[0].elements;

		if (isChecked) {
			form.firstname.value = 'Nau';
			form.lastname.value = 'Dev';
			form.billingStreet.value = '187 Dien Bien Phu, Da Kao Ward';
			form.billingCity.value = '01'; // district
			form.billingCountry.value = 'VN';
			form.billingPostCode.value = '700000';
			form.billingStateProvince.value = 'Hồ Chí Minh';
			form.email.value = 'dev@naustud.io';
			form.amount.value = '900000';
			form.phoneNumber.value = '0123456789';
		} else {
			form.firstname.value = '';
			form.lastname.value = '';
			form.billingStreet.value = '';
			form.billingCountry.value = '';
			form.billingCity.value = '';
			form.billingPostCode.value = '';
			form.billingStateProvince.value = '';
			form.amount.value = '';
			form.email.value = '';
			form.phoneNumber.value = '';
		}
	});
});
