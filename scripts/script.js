var myMap = L.map('map', {doubleClickZoom: false}).setView([40.741895, -73.989308], 16);
window.mobile = false; // If page is in compact mode.
$("#street_view").hide(); // Street view is visible when the street_view_button is pressed.

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
		$("#button_and_address").css("bottom", "371px");
		$("#address").css("bottom", "0px");

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
		$("#button_and_address").css("bottom", "30px");
		$("#address").css("bottom", "16px");
	}
};

/*
 * Removes each marker from the map, then populates the map with all events
 * that fall in [year] and [month]. If month == 'all', then month is irrelevant.
 * In the future, may add functionality to filter by event type too, using icons
 * in the legend as buttons.
 */
var event_query = function(year, month) {
	
}

resize_fun(); // If looking at webpage on a phone, rearranges elements.
$(window).resize(resize_fun);

// Removes the intro screen.
$("#to_map").on("click", function() {
	$("#intro_screen").remove();
	$("body").css("overflow", "visible");
});

// Toggles between the map and the street view image.
$("#street_view_button").on("click", function() {
	if ($(this).text() === "See modern day") {
		$(this).text("Back to map");
		$("#slider_box").hide();
		$("#map").hide();
		$("#street_view").show();
	}
	else {
		$(this).text("See modern day");
		$("#street_view").hide();
		$("#map").show();
		$("#slider_box").show();
	}
});

// Changes year, then calls event_query to update markers.
$("#slider").on("input", function() {
	var year = $(this).val();
	$('#year').html(year);
});

