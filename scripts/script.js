// ------ OPTIONS ---------------------------
var BEGIN_YR = 1961;
var END_YR = 1995;
var YEAR_RANGE = END_YR - BEGIN_YR;
var ST_VIEW_UNSELECTED = "See modern day";
var ST_VIEW_SELECTED = "Back to map";
var DESKTOP_TTL = "Black History in Washington D.C.";
var MOBILE_TTL = "D.C. Black History";
// ------------------------------------------

var mobile = false; // If page is in compact mode.
var displayed = []; // All icons currently being displayed on the map.
var allMarkers = new Array(YEAR_RANGE); // Holds arrays of markers. Indexed by [year] - BEGIN_YR.

for (i = 0; i <= YEAR_RANGE; i++) {
	allMarkers[i] = []; // Each element holds a list of events that happen in same year.
}

$("#street_view").hide(); // Street view is visible when the street_view_button is pressed.

var myMap = L.map('map', {
	doubleClickZoom: false,  // User may accidently zoom when trying to click markers.
}).setView(
	[38.896846, -77.035353], // Initial map position.
	12						 // Initial map zoom.
);

// Adds the tile layer to the map, then adds the map to the page.
// TO CHANGE MAP, VISIT https://leaflet-extras.github.io/leaflet-providers/preview/
L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" \
		target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; \
		<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);


/*
 * Fires when a slider changes. Changes year text and switches up markers.
 */
var changeYear = function() {
	var yr = $(this).val();
	$('#year').text(yr);
	$('#mobile_year')
		.text(yr)
		.css("left", ((yr - BEGIN_YR) * 15) + "px"); // Moves year text.
	eventQuery(yr, $("#month_select option:selected").text());
};


/*
 * Rearranges page elements when the window gets thinner. Basically moves the 
 * right half of the table into the left half, then moves THAT element above 
 * the table so that it centers on the page. Also swaps the slider to mobile 
 * version. If street view is showing, first resets back to map or else map SEIZES.
 */
$(window).resize(function() {
	if ($(this).width() < 1200 && ! mobile) {
		// Tranforms into compact mode.
		mobile = ! mobile; // Switch mode.
		var yr = $("#year").text();

		if ($("#street_view_button").text() === ST_VIEW_SELECTED) {
			$("#street_view_button").trigger('click');
		}

		$("#legend")
			.after($("#right_box").detach())
			.before('<input type="range" id="mobile_slider" \
				min="1961" max="1995" value="' + yr + '"/>')
			.css("margin-bottom", "10px");

		$("#title_box")
			.after($("#mobile_holder").detach())
			.text(MOBILE_TTL);

		$("#slider_box").css("visibility", "hidden");

		$("#mobile_slider")
			.before('<div id="mobile_year">' + yr + '</div>')
			.on('input', changeYear);

		$("#mobile_year").css("left", ((yr - BEGIN_YR) * 15) + "px");
		$("#button_and_address").css("bottom", "371px");
		$("#address").css("bottom", "0px");

		$(".purple_box").each(function() {
			$(this).css("width", "650px");
		});
	}
	else if ($(this).width() >= 1200 && mobile) {
		// Transforms into desktop mode.
		mobile = ! mobile; // Switch mode.

		if ($("#street_view_button").text() === ST_VIEW_SELECTED) {
			$("#street_view_button").trigger('click');
		}

		$(".purple_box").each(function() {
			$(this).css("width", "1200px");
		});

		$("#legend").css("margin-bottom", "");
		$("#slider").val($("#year").text());
		$("#mobile_slider").off('input').detach();
		$("#mobile_year").detach();
		$("#slider_box").css("visibility", "visible");
		$("#title_box").text(DESKTOP_TTL);
		$("#left_pane").html($("#mobile_holder").detach());
		$("#right_pane").html($("#right_box").detach());
		$("#button_and_address").css("bottom", "30px");
		$("#address").css("bottom", "16px");
	}
}).trigger('resize'); // Trigger resize when page loads.


/*
 * Removes each marker from the map, then populates the map with all events
 * that fall in [year] and [month]. If month == 'all', then month is irrelevant.
 * Finally, fits bounds of the map around the points.
 */
var eventQuery = function(year, month) {
	for (i = 0; i < displayed.length; i++) {
		displayed[i].remove();
	}

	displayed.length = 0;
	var bounds = [];

	allMarkers[year - BEGIN_YR].forEach(function(marker) {
		displayed.push(marker);
		marker.addTo(myMap);
		bounds.push(marker.getLatLng());
	});

	if(bounds.length) {
		myMap.fitBounds(bounds, {maxZoom: 15, padding: L.point(20,20)});
		displayed[0].fire('click');
	}
};


// Removes the intro screen.
$("#to_map").on("click", function() {
	$("#intro_screen").remove();
	$("body").css("overflow", "visible");
});


// Toggles between the map and the street view image.
$("#street_view_button").on("click", function() {
	if ($(this).text() === ST_VIEW_UNSELECTED) {
		$(this).text(ST_VIEW_SELECTED);
		$("#slider_box").hide();
		$("#map").hide();
		$("#mobile_slider").hide();
		$("#mobile_year").hide();
		$("#street_view").show();
	}
	else {
		$(this).text(ST_VIEW_UNSELECTED);
		$("#street_view").hide();
		$("#map").show();
		$("#slider_box").show();
		$("#mobile_slider").show();
		$("#mobile_year").show();
	}
});


// Changes year, then calls event_query to update markers.
$("#slider").on("input", changeYear);


// Instantiate all icon types.
var p = 'images/icons/';

var fists = [
	L.icon({iconUrl: p + 'fst_ic_un.png',   iconSize: [30, 63]}), // UNSELECTED ICON.
	L.icon({iconUrl: p + 'fst_ic_sel.png',  iconSize: [30, 63]})  // SELECTED ICON.
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


(function() {
	// Deselects all icons on the map, then selects this one.
	var iconFlip = function() {
		displayed.forEach(function(marker) {
			marker.remove();
			marker.setIcon(marker.icons[0]);
			marker.addTo(myMap);
		});

		// Changes icon.
		this.remove();
		this.setIcon(this.icons[1]);
		this.addTo(myMap);
		
		// Display all the event information.
		var e = spreadsheet.events[this.eventRef];
		$("#desc_title").text(e.Event_name);
		$("#desc_body").text(e.Description);
	};

	// Populate allMarkers.
	for (i = 0; i < spreadsheet.events.length; i++) {
		var e = spreadsheet.events[i];

		if (e["Start Date (Year)"] && e.Latitude && e.Longitude) {
			var start = e["Start Date (Year)"];
			var marker = L.marker([e.Latitude, e.Longitude], {icon: fists[0]});
			marker.eventRef = i;
			marker.icons = fists;
			marker.on('click', iconFlip);
			allMarkers[start - BEGIN_YR].push(marker);
		}
	}
})();

eventQuery(BEGIN_YR, "All"); // Default year to start with is first year.
displayed[0].fire('click');  // Default event is fiirst icon in the list.