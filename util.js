
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

exports.formatTwitterDate = function (dateString) {
	var date = new Date(dateString);
	var formatedDate = ('0' + (date.getHours() % 12 || 12)).slice(-2) + ":" 
				+ ('0' + date.getMinutes()).slice(-2) 
				+ " " + (date.getHours() <= 12 ? "AM" : "PM" ) + " - " 
				+ ('0' + date.getDate()).slice(-2) 
				+ " " + monthNames[date.getMonth()] + " " + date.getFullYear();
	return formatedDate;
};