var myMap = L.map('map', {doubleClickZoom: false}).setView([40.741895, -73.989308], 16);
window.mobile = false; // If page is in compact mode.

// Create Leaflet map and add it to the page.
var simple = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);

/*
 * Rearranges page elements when the window gets thinner.
 * Basically moves the right half of the table into the left half,
 * then moves THAT element above the table so that it centers on
 * the page.
 */
var resize_fun = function() {
	window.mobile = !window.mobile; // Switch mode.

	if ($(this).width() < 1200 && window.mobile) {
		// Tranforms into compact mode.
		var right = $("#right_box").detach();
		$("#legend").after(right).css("margin-bottom", "10px");
		var holder = $("#mobile_holder").detach();
		$("#title_box").after(holder).text("D.C. Black History");

		$(".purple_box").each(function() {
			$(this).css("width", "650px");
		});
	}
	else if ($(this).width() >= 1200 && !window.mobile) {
		// Transforms into desktop mode.
		$(".purple_box").each(function() {
			$(this).css("width", "1200px");
		});

		$("#legend").css("margin-bottom", "");
		$("#title_box").text("Black History in Washington D.C.");
		var holder = $("#mobile_holder").detach();
		$("#left_pane").html(holder);
		var right = $("#right_box").detach();
		$("#right_pane").html(right);
	}
};

resize_fun(); // If looking at webpage on a phone, rearranges elements.
$(window).resize(resize_fun);

$("#to_map").on("click", function() {
	$("#intro_screen").remove();
	$("body").css("overflow", "visible");
});

$("#slider").on("input", function() {
	var curYear = document.getElementById('slider').value;
	$('#year').html(curYear);
});

