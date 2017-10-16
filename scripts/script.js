var BEGIN_YEAR = 1961;
var END_YEAR = 1995;
var YEAR_RANGE = END_YEAR - BEGIN_YEAR;

var myMap = L.map('map', {
	doubleClickZoom: false,
}).setView([38.896846, -77.035353], 12);

window.mobile = false; // If page is in compact mode.
$("#street_view").hide(); // Street view is visible when the street_view_button is pressed.


// Create Leaflet map and add it to the page.
var simple = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" \
		target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; \
		<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);


// Holds all icons currently being displayed on the map.
var displayed = [];


// An array which holds arrays of event markers that fall within same year.
// Array is indexed by [event year] - BEGIN_YEAR
var allMarkers = new Array(YEAR_RANGE);

for (i = 0; i <= YEAR_RANGE; i++) {
	allMarkers[i] = new Array(); 
}


/*
 * Rearranges page elements when the window gets thinner.
 * Basically moves the right half of the table into the left half,
 * then moves THAT element above the table so that it centers on
 * the page. Also swaps the slider to mobile version.
 */
var resizeFun = function() {
	if ($(this).width() < 1200 && ! window.mobile) {
		// Tranforms into compact mode.
		window.mobile = ! window.mobile; // Switch mode.
		var yr = $("#year").text();

		$("#legend")
			.after($("#right_box").detach())
			.before('<input type="range" id="mobile_slider" \
				min="1961" max="1995" value="' + yr + '"/>')
			.css("margin-bottom", "10px");

		$("#title_box")
			.after($("#mobile_holder").detach())
			.text("D.C. Black History");

		$("#slider_box").css("visibility", "hidden");

		$("#mobile_slider")
			.before('<div id="mobile_year">' + yr + '</div>')
			.on('input', sliderFun);

		$("#mobile_year").css("left", ((yr - BEGIN_YEAR) * 15) + "px");
		$("#button_and_address").css("bottom", "371px");
		$("#address").css("bottom", "0px");

		$(".purple_box").each(function() {
			$(this).css("width", "650px");
		});
	}
	else if ($(this).width() >= 1200 && window.mobile) {
		// Transforms into desktop mode.
		window.mobile = ! window.mobile; // Switch mode.

		$(".purple_box").each(function() {
			$(this).css("width", "1200px");
		});

		$("#legend").css("margin-bottom", "");
		$("#slider").val($("#year").text());
		$("#mobile_slider").off('input').detach();
		$("#mobile_year").detach();
		$("#slider_box").css("visibility", "visible");
		$("#title_box").text("Black History in Washington D.C.");
		$("#left_pane").html($("#mobile_holder").detach());
		$("#right_pane").html($("#right_box").detach());
		$("#button_and_address").css("bottom", "30px");
		$("#address").css("bottom", "16px");
	}
};


/*
 * Fires when a slider changes. Changes year text and switches up markers.
 */
var sliderFun = function() {
	var year = $(this).val();
	$('#year').html(year);
	$('#mobile_year').html(year);
	eventQuery(year, $("#month_select option:selected").text());

	// Moves year text above mobile_slider. Mobile-mode only.
	$("#mobile_year").css("left", ((year - BEGIN_YEAR) * 15) + "px");
};


/*
 * Removes each marker from the map, then populates the map with all events
 * that fall in [year] and [month]. If month == 'all', then month is irrelevant.
 * Finally, fits bounds of the map around the points.
 */
var eventQuery = function(year, month) {
	displayed.forEach(function(marker) {
		marker.remove();
	});

	while (displayed.pop()) {}

	var bounds = new Array(allMarkers[year - BEGIN_YEAR].length);

	if(bounds.length) {
		allMarkers[year - BEGIN_YEAR].forEach(function(marker) {
			displayed.push(marker);
			marker.addTo(myMap);
			bounds.push(marker.getLatLng());
		});

		myMap.fitBounds(bounds, {maxZoom: 15, padding: L.point(20,20)});
		displayed[0].fire('click');
	}
};


/*
 * Filters all markers on the map so that only the events with attribute [key]
 * have the value [value].
 * For example, key could be 'event type' and value could be 'political'.
 */
var filterMarkers = function(key, value) {

};


/*
 * Uses index to locate event info from all_data.js and displays the 
 * information on the page.
 */
var displayEvent = function(index) {
	var event = spreadsheet.events[index];
	$("#desc_title").text(event.Event_name);
	$("#desc_body").text(event.Description);
}


/*
 * Deselects each icon on the map.
 */
var deselectAll = function() {
	displayed.forEach(function(marker) {
		marker.remove();
		marker.setIcon(marker.icons[0]);
		marker.addTo(myMap);
	});
}

resizeFun(); // If looking at webpage on a phone, rearranges elements.
$(window).resize(resizeFun);


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
		$("#mobile_slider").hide();
		$("#mobile_year").hide();
	}
	else {
		$(this).text("See modern day");
		$("#street_view").hide();
		$("#map").show();
		$("#slider_box").show();
		$("#mobile_slider").show();
		$("#mobile_year").show();
	}
});


// Changes year, then calls event_query to update markers.
$("#slider").on("input", sliderFun);


// Instantiate all icon types.
var p = 'images/icons/';

var fists = [
	L.icon({iconUrl: p + 'fst_ic_un.png',   iconSize: [30, 63]}),
	L.icon({iconUrl: p + 'fst_ic_sel.png',  iconSize: [30, 63]})
];
var brushes = [
	L.icon({iconUrl: p + 'brsh_ic_un.png',  iconSize: [47, 70]}),
	L.icon({iconUrl: p + 'brsh_ic_sel.png', iconSize: [47, 70]})
];
var dollars = [
	L.icon({iconUrl: p + 'dllr_ic_un.png',  iconSize: [30, 70]}),
    L.icon({iconUrl: p + 'dllr_ic_sel.png', iconSize: [30, 70]})
];
var globes = [
	L.icon({iconUrl: p + 'glb_ic_un.png',   iconSize: [47, 70]}),
    L.icon({iconUrl: p + 'glb_ic_sel.png',  iconSize: [47, 70]})
];
var schools = [ 
	L.icon({iconUrl: p + 'schl_ic_un.png',  iconSize: [47, 70]}),
	L.icon({iconUrl: p + 'schl_ic_sel.png', iconSize: [47, 70]})
];


// Select this icon, deselect all others on the map.
var iconFlip = function() {
	deselectAll(); // This should be called first.
	this.remove();
	this.setIcon(this.icons[1]);
	displayEvent(this.eventRef);
	this.addTo(myMap);
};


// Populate allMarkers.
(function() {
	for (i = 0; i < spreadsheet.events.length; i++) {
		var event = spreadsheet.events[i];

		if (event["Start Date (Year)"] && event.Latitude && event.Longitude) {
			var start = event["Start Date (Year)"];
			var marker = L.marker([event.Latitude, event.Longitude], {icon: fists[0]});
			marker.eventRef = i;
			marker.icons = fists;
			marker.on('click', iconFlip);
			allMarkers[start - BEGIN_YEAR].push(marker);
		}
	}
})();

eventQuery(BEGIN_YEAR, "All");
displayed[0].fire('click');