// ------ OPTIONS ---------------------------
var BEGIN_YR = 1961;  // Earliest year an event occurs. Change if adding events!
var END_YR = 1995;    // Latest year an event occurs. See above.
var ST_VIEW_UNSELECTED = "See modern day";
var ST_VIEW_SELECTED = "Back to map";
var DESKTOP_TTL = "Black History in Washington D.C.";
var MOBILE_TTL = "D.C. Black History";
var PRESENT = "present"; // Word used in spreadsheet to say event is still occurring.
var ICN_PTH = 'images/icons/'; // Path to where icons are.
var MBL_THRESH = 1200; // Width at which devince is considered 'mobile'.
var BOUNDS_OPTIONS = {
	maxZoom: 15, 
	paddingBottomRight: L.point(60,60), 
	paddingTopLeft: L.point(30,30)
}; // Bounds used to fit markers on map.

// Change if modifying spreadsheet field names.
var SHEET_NAME = "DC BLACK POWER CHRONICLES - Chronology";
var E_STRT = "Start_Year";
var E_END  = "End_Date";
var E_ADDR = "Geography_Address ";
var E_DESC = "Description";
var E_NAME = "Event_Name";
var E_LAT  = "Latitude";
var E_LONG = "Longitude";
var E_STVW = "Street_View_URL";
var E_LBL  = "Label";
// ------------------------------------------

// The '+ 1' is there since last index is used to display all the markers.
var ALL = END_YR + 1; // If slider is in last position, all markers are displayed.
var NUM_YEARS = END_YR - BEGIN_YR + 1;
var ALL_MARKERS = new Array(NUM_YEARS + 1); // Holds arrays of markers. Indexed by [year] - BEGIN_YR + offset.

var mobile = false;  // If page is in compact mode.
var selected = null; // The currently selected marker.
var displayed = [];  // All icons currently being displayed on the map.

for (i = 0; i < NUM_YEARS + 1; i++) {
	ALL_MARKERS[i] = []; // Each element holds a list of events that happen in same year.
}

$("#street_view").hide(); // Street view is visible when the street_view_button is pressed.


/*
 * Adds the tile layer to the map, then adds the map to the page.
 * TO CHANGE MAP, VISIT https://leaflet-extras.github.io/leaflet-providers/preview/
 */
var myMap = L.map('leaflet_map', {
	zoomSnap: 0,    // Map zoom must be a multiple of this. 
	zoomDelta: 0.6, // How much map zoom changes. 
	minZoom: 10,    // Map cannot zoom out beyond this.
	zoomAnimationThreshold: 10,
	layers: L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', 
		{
			attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" \
			target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; \
			<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}
	)
});

/*
 * Rearranges page elements when the window gets thinner. Basically moves the
 * right half of the table into the left half, then moves THAT element above
 * the table so that it centers on the page. Also swaps the slider to mobile
 * version. If street view is showing, first resets back to map or else map SEIZES.
 */
$(window).resize(function() {
	var b = $("#street_view_button");

	if ($(this).width() < MBL_THRESH && ! mobile) {
		// Tranforms into compact mode.
		mobile = ! mobile; // Switch mode.
		var yr = $("#slider").val();

		b.text() == ST_VIEW_SELECTED && b.trigger('click', true); // Prevents map seizing.

		$("#legend")
			.after($("#right_box").detach())
			.before('<input type="range" id="mobile_slider" class="fade_group" \
				min="1961" max="' + ALL + '" value="' + yr + '"/>')
			.css("margin-bottom", "10px");
		$("#title_box")
			.after($("#mobile_holder").detach())
			.text(MOBILE_TTL);
		$("#slider_box").css("visibility", "hidden")
		    .before('<div id="mobile_arrows" class="fade_group"></div>');
		$("#mobile_arrows")
		    .html('<button id="mobile_left_arrow" class="arrow"></button> \
		           <button id="mobile_right_arrow" class="arrow"></button>');
		$("#mobile_slider")
			.before('<div id="mobile_year" class="fade_group">' + (yr == ALL ? 'All' : yr) + '</div>')
			.on('input', changeYear);
		$("#mobile_left_arrow").click(function() {
		    $("#left_arrow").click();
		});
		$("#mobile_right_arrow").click(function() {
		    $("#right_arrow").click();
		});
		$("#mobile_year").css("left", ((yr - BEGIN_YR) * 15) + "px");
		$("#button_and_address").css("bottom", "371px");
		$("#address").css("bottom", "0px");
		$(".purple_box").css("width", "650px");
	}
	else if ($(this).width() >= MBL_THRESH && mobile) {
		// Transforms into desktop mode.
		mobile = ! mobile; // Switch mode.
		
		b.text() == ST_VIEW_SELECTED && b.trigger('click', true);

		$(".purple_box").css("width", MBL_THRESH + "px");
		$("#legend").css("margin-bottom", "");
		$("#slider").val($("#mobile_slider").val());
		$("#mobile_slider").off('input').detach();
		$("#mobile_year").detach();
		$("#mobile_arrows").detach();
		$("#slider_box").css("visibility", "visible");
		$("#title_box").text(DESKTOP_TTL);
		$("#left_pane").html($("#mobile_holder").detach());
		$("#right_pane").html($("#right_box").detach());
		$("#button_and_address").css("bottom", "30px");
		$("#address").hide(0, function() {
			$(this).css("bottom", ($(this).height() - 26) + "px").show();
		});
	}
}).ready(function() {
	$(this).trigger('resize');
});


/*
 * Deselects the currently selected marker.
 * 'replace' can be anything.
 */
function clearSelected(replace) {
    if (selected) {
		selected.remove();
		selected.setIcon(selected.ICONS[0]);
		replace ? selected.addTo(myMap) : selected = null;
	}
}


/*
 * Removes each marker from the map, then populates the map with all events
 * that fall in [year]. If type is defined, also checks that the event is
 * same type. Fits bounds of the map around the points.
 */
function eventQuery(year, type) {
	for (i = 0; i < displayed.length; i++) {
		displayed[i].remove();
	}

	selected = null; 	  // Not needed, just for consistency.
	displayed.length = 0; // Clears array.
	var bounds = [];      // List of coordinates for map panning.

	ALL_MARKERS[year - BEGIN_YR].forEach(function(marker) {
	    if (! type || spreadsheet.events[marker.EVENT_INDEX][E_LBL] == type) {
    		displayed.push(marker);
    		marker.addTo(myMap);
    		bounds.push(marker.getLatLng());
	    }
	});

	if(bounds.length) {
		myMap.fitBounds(bounds, BOUNDS_OPTIONS);
		displayed[0].fire('click', {fast: true});
		displayed[0].closeTooltip();
	}
};


/*
 * Fires when a slider changes. Changes year text and switches up markers.
 * Global since #mobile_slider is dynamically attached and detached from the DOM.
 */
var changeYear = function() {
	var yr = $(this).val();
	$('#year').text(yr == ALL ? 'All' : yr);
	$('#mobile_year').text(yr == ALL ? 'All' : yr).animate({
		left: ((yr - BEGIN_YR) * 14.5) + "px"
	}, 15, 'linear');

	clearSelected();
	eventQuery(yr);
};


/*
 * Removes the intro screen.
 */
$("#to_map").click(function() {
	$("#intro_box").slideUp();
	$("#intro_screen").delay(150).fadeOut();
	$("body").css("overflow", "visible");
});


/*
 * Toggles between the map and the street view image.
 */
$("#street_view_button").click(function(e, show) {
	var FADE_TIME = 150;

	if ($(this).text() === ST_VIEW_UNSELECTED) {
		$(this).text(ST_VIEW_SELECTED);
		$(".fade_group").fadeOut(FADE_TIME); // mobile_slider, mobile_year, slider_box, mobile_arrows
		$("#leaflet_map").fadeOut(FADE_TIME, function() {
			$("#street_view").fadeIn(FADE_TIME);
		});
	}
	else {
		$(this).text(ST_VIEW_UNSELECTED);

		if (show) {
			// Animation causes seizing when screen resizes.
			$("#street_view").hide();
			$("#leaflet_map").show();
			$(".fade_group").show();
		}
		else {
			$("#street_view").fadeOut(FADE_TIME, function() {
				$("#leaflet_map").fadeIn(FADE_TIME);
				$(".fade_group").fadeIn(FADE_TIME);
			});
		}
	}
});


/*
 * Changes year, then calls event_query to update markers.
 */
$("#slider").on("input", changeYear);


/*
 * Animates legend icons when interacted with.
 * Clicking them filters markers by event type.
 */
(function() {
	var clickE = function(e) {
    	var text = $(this).next();
    		
    	$(this)
    	    .animate({bottom: "-6px"}, 90)
    		.animate({bottom: "4px"}, 90)
    		.animate({bottom: "0px"}, 90);
    			
        if ($("#street_view_button").text() != ST_VIEW_SELECTED) {
            clearSelected();
            var yr = mobile ? $("#mobile_slider").val() : $("#slider").val();
    
    		if (text.css("font-style") == "normal") {
    			var lbl = $(this).attr('id');
    			$(".icon_text").css("font-style", "normal");
    			text.css("font-style", "oblique");
    			eventQuery(yr, lbl);
    		}
    		else {
    			text.css("font-style", "normal");
    			eventQuery(yr);
    		}
	    }
	};
	var hvrInE = function() {
		$(this).animate({bottom: "4px"}, 90);
	};
	var hvrOutE = function() {
		$(this).animate({bottom: "0px"}, 90);
	};
	$(".icon_button").click(clickE).hover(hvrInE, hvrOutE);
})();


/*
 * Adds functionality to arrow buttons. Switches between markers on map.
 */
(function() {
    $("#right_arrow").click(function() {
        var i = 0;

        for (; i < displayed.length && displayed[i] != selected; i++)
            ; // Finds currently selected marker. Index is needed.

        (i < displayed.length - 1) && displayed[i+1].fire('click');
    });
    
    $("#left_arrow").click(function() {
        var i = 0;
       
        for (; i < displayed.length && displayed[i] != selected; i++)
            ;
        
        (i > 0) && displayed[i-1].fire('click');
    });
})();
 

/*
 * Load markers and display first year.
 */
(function() {

	// Instantiate all icon types.
	var FISTS = [
		L.icon({iconUrl: ICN_PTH + 'fst_ic_un.png',   iconSize: [20, 40]}), // Unselected icon.
		L.icon({iconUrl: ICN_PTH + 'fst_ic_sel.png',  iconSize: [20, 40]})  // Selected icon.
	];
	var BRUSHES = [
		L.icon({iconUrl: ICN_PTH + 'brsh_ic_un.png',  iconSize: [47, 70]}),
		L.icon({iconUrl: ICN_PTH + 'brsh_ic_sel.png', iconSize: [47, 70]})
	];
	var DOLLARS = [
		L.icon({iconUrl: ICN_PTH + 'dllr_ic_un.png',  iconSize: [15, 40]}),
	    L.icon({iconUrl: ICN_PTH + 'dllr_ic_sel.png', iconSize: [15, 40]})
	];
	var GLOBES = [
		L.icon({iconUrl: ICN_PTH + 'glb_ic_un.png',   iconSize: [20, 32]}),
	    L.icon({iconUrl: ICN_PTH + 'glb_ic_sel.png',  iconSize: [20, 32]})
	];
	var SCHOOLS = [
		L.icon({iconUrl: ICN_PTH + 'schl_ic_un.png',  iconSize: [47, 70]}),
		L.icon({iconUrl: ICN_PTH + 'schl_ic_sel.png', iconSize: [47, 70]})
	];


	/*
	 * Deselects currently selected marker, then selects this one.
	 * Fast is false if event is caused from the slider moving.
	 * This is bound to each marker.
	 */
	var iconFlip = function(speed) {
		if (selected == this) return; // User clicked the same one twice.

		clearSelected('replace');

		// Changes icon.
		this.remove();
		this.setIcon(this.ICONS[1]);
		this.addTo(myMap);
		selected = this;
		
		// Display all the event information.
		var e = spreadsheet.events[this.EVENT_INDEX];
		var end = (e[E_END] == "") ? "?" : e[E_END];
		var timeSpan = (e[E_STRT] == end) ? e[E_STRT] : e[E_STRT] + " - " + end;
		var ANIMATE_TIME = 200;

		if (speed.fast) {
			$("#desc_title").text(e[E_NAME]);
			$("#desc_body").html('<sup><i>' + timeSpan + '</i></sup><br>' + e[E_DESC]);
			$("#address").hide(0, function() {
				$(this).text(e[E_ADDR])
					.css('bottom', mobile ? "0px" : ($(this).height() - 26) + "px")
					.show();
			});
		}
		else {
			$("#desc_body").fadeOut(ANIMATE_TIME, function() {
				$(this).html('<sup><i>' + timeSpan + '</i></sup><br>' + e[E_DESC])
					.fadeIn(ANIMATE_TIME)
			});
			$("#desc_title").slideUp(ANIMATE_TIME, function() {
				$(this).text(e[E_NAME]).slideDown(ANIMATE_TIME);
			});
			$("#address").fadeOut(ANIMATE_TIME, function() {
				$(this).text(e[E_ADDR])
					.css('bottom', mobile ? "0px" : ($(this).height() - 26) + "px")
					.fadeIn(ANIMATE_TIME);
			});
		}
		$("#street_view iframe").attr("src", e[E_STVW] || "");
	};

	// Populate ALL_MARKERS.
	var toolTipOptions = {opacity: 0.8, className: 'tooltip'};

	for (i = 0; i < spreadsheet.events.length; i++) {
		var e = spreadsheet.events[i];

		if (e[E_STRT] && e[E_LAT] && e[E_LONG]) {
			// To add a marker, it must have a start date and a position.
			var marker = L.marker([e[E_LAT], e[E_LONG]]);
			var start = e[E_STRT] - BEGIN_YR;

			switch (e[E_LBL]) {
				case "P/EP":  marker.ICONS = FISTS;   break;
				case "BA": 	  marker.ICONS = BRUSHES; break;
				case "BB":    marker.ICONS = DOLLARS; break;
				case "IS":    marker.ICONS = SCHOOLS; break;
				case "PA/IS": marker.ICONS = GLOBES;  break;
				default:      marker.ICONS = FISTS;   break;
			}
			marker.setIcon(marker.ICONS[0]);
			marker.EVENT_INDEX = i;
			marker.on('click', iconFlip);
			if ($(window).width() >= MBL_THRESH) {
			    marker.bindTooltip(e[E_NAME], toolTipOptions); // Tooltip not needed for mobile
			}
			
			if (e[E_END]) {
				// Add this to every year it falls into.
				var range = (e[E_END] === PRESENT) ? ALL_MARKERS.length : e[E_END] - e[E_STRT];

				for (j = 0; start + j < ALL_MARKERS.length - 1 && j <= range; j++) {
					ALL_MARKERS[start + j].push(marker);
				}
			}
			else {
				ALL_MARKERS[start].push(marker);
			}

			ALL_MARKERS[ALL_MARKERS.length-1].push(marker); // All markers are put in final slot.
		}
	}

	eventQuery(BEGIN_YR);
})();