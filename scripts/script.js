var myMap = L.map('map', {doubleClickZoom: false}).setView([40.741895, -73.989308], 16);


var simple = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);

/*
$(window).scroll(function() {
	$("#map_content").css("top", Math.max(10, 130 - $(this).scrollTop()));
});
*/
$("#to_map").on("click", function() {
	$("#intro_screen").remove();
	$("body").css("overflow", "visible");
});

$("#slider").on("input", function() {
	var curYear = document.getElementById('slider').value;
	document.getElementById('year').firstChild.nodeValue = curYear;
});