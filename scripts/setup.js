/**
 * Author: Kevin Rapa
 */

// ------ OPTIONS ------------------------------------------------------
var BEGIN_YR = 1961;  // Earliest year an event occurs. Change if adding events!
var END_YR = 1995;    // Latest year an event occurs. See above.
var ST_VIEW_UNSELECTED = "To street view";
var ST_VIEW_SELECTED = "To map";
var DESKTOP_TTL = "Black History in Washington D.C.";
var MOBILE_TTL = "D.C. Black History";
var PRESENT = "present"; // Word used in spreadsheet to say event is still occurring.
var IC_PTH = 'images/icons/'; // Path to where icons are.
var MBL_THRESH = 1200; // Width at which devince is considered 'mobile'.
var BOUNDS_OPTIONS = {
	maxZoom: 15, // Auto-panning of map can't zoom in past this.
	paddingBottomRight: L.point(80,80), // So markers don't hide behind slider.
	paddingTopLeft: L.point(25,25) // So markers don't appear half off the map.
};

// ---------------------------------------------------------------------
// Change if modifying spreadsheet field names.
var SHEET_NM = "Black Power Events and Organizations";
var E_STRT = "Start_Year";
var E_END  = "End_Year";
var E_ADDR = "Geography_Address";
var E_DESC = "Description";
var E_NAME = "Event_Name";
var E_LAT  = "Latitude";
var E_LONG = "Longitude";
var E_STVW = "St_View_URL";
var E_LBL  = "Label";
var E_CPTN = "Picture Caption";
var E_SRC = "Sources";

// Label names
var INTR = "PA/IS"; // Pan Africanism
var ART = "BA";		// Black arts
var BUS = "BB";		// Black business
var EDU = "IS"; 	// Education
var POL = "P/EP";	// Electoral politics

var IMG_EXT = ".jpg"; // File extension for the historical images
// ---------------------------------------------------------------------

var ALL = END_YR + 1; // '+ 1' there since last index is used to display every marker.
var NUM_YEARS = END_YR - BEGIN_YR + 1;
var ALL_MARKERS = new Array(NUM_YEARS + 1); // Indexed by [year] - BEGIN_YR + offset.

var M_SLDR_THMB_W = 80; // Mobile slider thumb width.
var M_SLDR_W = 570;     // Width of the mbl sider.
var CELL_WIDTH = (M_SLDR_W - M_SLDR_THMB_W) / NUM_YEARS; // To align mbl_year with mbl_slider thumb

var mobile = false;  // If page is in compact mode.
var selected = null; // The currently selected marker.
var displayed = [];  // All icons currently being displayed on the map.

for (i = 0; i < NUM_YEARS + 1; i++) {
	ALL_MARKERS[i] = []; // Each element holds a list of events that happen in same year.
}

$("#street_view").hide(); // Visible when the street_view_button is pressed.


/*
 * Adds the tile layer to the map, then adds the map to the page.
 * TO CHANGE MAP, VISIT https://leaflet-extras.github.io/leaflet-providers/preview/
 */
var myMap = L.map('leaflet_map', {
	zoomSnap: 0,    // Map zoom must be a multiple of this.
	zoomDelta: 0.6, // How much map zoom changes.
	minZoom: 8,     // Map cannot zoom out beyond this.
	zoomAnimationThreshold: 10, // How high zoom must be for no pan animation to occur.
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
	if (! mobile && $(this).width() < MBL_THRESH) {
		// Transforms into compact mode.
		mobile = ! mobile;
		var b = $("#street_view_button");
		var yr = $("#slider").val();

		if (b.text() == ST_VIEW_SELECTED) {
			b.trigger('click', true); // Prevents map seizing.
		} 

		$("#legend")
			.after($("#right_box").detach())
			.before('<input type="range" id="mbl_slider" class="fade_group" \
					min="1961" max="' + ALL + '" value="' + yr + '"/>')
			.css("margin-bottom", "10px");

		$("#title_box")
			.after($("#mbl_holder").detach())
			.text(MOBILE_TTL);
        
		$("#slider_box")
			.css("visibility", "hidden")
			.before('<input type="range" id="mbl_marker_slider" class="fade_group" \
			    	min="0" max="' + (displayed.length - 1) + '" val="0"></input>');

		$("#mbl_slider")
			.before('<div id="mbl_year" class="fade_group">' +
					(yr == ALL ? 'All' : yr) + '</div>')
			.on('input', changeYear);
        
		var mbl_mrkr_sldr = $("#mbl_marker_slider")
			.on("input", function() {
				displayed[$(this).val()].fire('click');
			});
		if (displayed.length <= 1) {
			mbl_mrkr_sldr.hide();
		}

		$("#mbl_year").css("left", ((yr - BEGIN_YR) * CELL_WIDTH + 10) + "px"); // Aligns it
		$(".purple_box").css("width", "650px");
	}
	else if (mobile && $(this).width() >= MBL_THRESH) {
		// Transforms into desktop mode.
		mobile = ! mobile;
		var b = $("#street_view_button");

		if(b.text() == ST_VIEW_SELECTED) {
			b.trigger('click', true);
		}

		$(".purple_box").css("width", MBL_THRESH + "px");
		$("#legend").css("margin-bottom", "");
		$("#slider").val($("#mbl_slider").val());
		$("#mbl_slider").off('input').detach();
		$("#mbl_year").detach();
		$("#mbl_marker_slider").detach();
		$("#slider_box").css("visibility", "visible");
		$("#title_box").text(DESKTOP_TTL);
		$("#left_pane").html($("#mbl_holder").detach());
		$("#right_pane").html($("#right_box").detach());
	}
}).ready(function() {
	$(this).trigger('resize');
});


/*
 * Removes the currently selected marker.
 * 'replace' can be anything. If replace is not null, the unselected version of the marker 
 * will be added back to the map . This only happens currently when the user clicks another 
 * marker in the current year. Otherwise, marker stays invisble (Like when the event types 
 * are being filtered).
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
	displayed = [];
	var bounds = [];      // List of coordinates for map panning.
	var MARKER_ARR = ALL_MARKERS[year - BEGIN_YR];

	for (i = 0; i < MARKER_ARR.length; i++) {
		var marker = MARKER_ARR[i];

		if (! type || SPREADSHEET[SHEET_NM][marker.EVENT_INDEX][E_LBL] == type) {
    		displayed.push(marker);
    		marker.addTo(myMap);
    		bounds.push(marker.getLatLng());
	    }
	}

	if(bounds.length) {
		myMap.fitBounds(bounds, BOUNDS_OPTIONS);
		displayed[0].fire('click', {fast: true});
		displayed[0].closeTooltip();
	}

	var mbl_mrkr_sldr = $('#mbl_marker_slider');

	if (mbl_mrkr_sldr) {
		if (displayed.length > 1) {
			mbl_mrkr_sldr.val(0);
			mbl_mrkr_sldr.attr('max', displayed.length - 1);
			mbl_mrkr_sldr.show();
		}
		else {
			mbl_mrkr_sldr.hide();
		}
	}
};


/*
 * Fires when a slider changes OR when an arrow button is pressed while the last or
 * first marker in a year is selected. Changes year text and switches up markers.
 *
 * The parameter 'year' is assigned a value only if this is called by an arrow button.
 * The sliders do not explicitly pass any arguments since the slider's value is used for
 * the year instead.
 */
var changeYear = function(event, year) {
	var yr = year ? year : $(this).val();
	var text = yr == ALL ? 'All' : yr
	
	$('#year').text(text);
	$('#mbl_year').text(text).animate({
		left: ((yr - BEGIN_YR) * CELL_WIDTH + 10) + "px"
	}, 15, 'linear');

	$('.icon_text').css("font-style", "normal"); // Reset icon type filter.

	clearSelected();
	eventQuery(yr);
};

$("#slider").on("input", changeYear);


/*
 * Removes the intro screen.
 */
$("#to_map").click(function() {
	$("#intro_box").slideUp();
	$("#intro_screen").delay(150).fadeOut();
	$("body").css("overflow", "visible");
});


/*
 * Restores the intro screen.
 */
$("#to_intro").click(function() {
	$("body").css("overflow", "hidden");
	$("#intro_screen").fadeIn();
	$("#intro_box").delay(150).slideDown();
});


/*
 * Toggles between the map and the street view image.
 *
 * The parameter 'show' is defined if the window is being resized. This
 * stops the animation from happening since that would cause seizing of the map.
 */
$("#street_view_button").click(function(e, show) {
	var FADE_TIME = 150; // Change to adjust time for street view to show.
	var btn = $(this);

	if (btn.text() === ST_VIEW_UNSELECTED) {
		btn.text(ST_VIEW_SELECTED);
		$(".fade_group").fadeOut(FADE_TIME); // mbl_slider, mbl_year, slider_box, mbl_marker_slider
		$("#leaflet_map").fadeOut(FADE_TIME, function() {
			if (btn.text() === ST_VIEW_SELECTED) {
				// 'If' needed since clicking the button quickly will mess things up.
				$("#street_view").fadeIn(FADE_TIME);
			}
		});
	}
	else {
		btn.text(ST_VIEW_UNSELECTED);

		if (show) {
			// Animation causes seizing when screen resizes.
			$("#street_view").hide(0, function() {
				if (btn.text() === ST_VIEW_UNSELECTED) {
					$("#leaflet_map").show();
					$(".fade_group").show();
				}
			});
		}
		else {
			$("#street_view").fadeOut(FADE_TIME, function() {
				if (btn.text() === ST_VIEW_UNSELECTED) {
					$("#leaflet_map").fadeIn(FADE_TIME);
					$(".fade_group").fadeIn(FADE_TIME);
				}
			});
		}
	}
});


/*
 * Animates legend icons when interacted with.
 * Clicking them filters markers by event type.
 */
(function() {
	var BOUNCE_TIME = 90; // Change to adjust button animation speed.
	
	var clickE = function(e) {
    	var text = $(this).next();
    		
    	$(this).animate({bottom: "-6px"}, BOUNCE_TIME)
    		.animate({bottom: "4px"}, BOUNCE_TIME)
    		.animate({bottom: "0"}, BOUNCE_TIME);
    			
        if ($("#street_view_button").text() != ST_VIEW_SELECTED) {
            clearSelected();
            var yr = mobile ? $("#mbl_slider").val() : $("#slider").val();
    
    		if (text.css("font-style") == "normal") {
    			// Filters by event type.
    			$(".icon_text").css("font-style", "normal");
    			text.css("font-style", "oblique");
    			eventQuery(yr, $(this).attr('id'));
    		}
    		else {
    			// Resets filter.
    			text.css("font-style", "normal");
    			eventQuery(yr);
    		}
	    }
	};

	var hvrInE = function() {
		$(this).animate({bottom: "4px"}, BOUNCE_TIME);
	};

	var hvrOutE = function() {
		$(this).animate({bottom: "0"}, BOUNCE_TIME);
	};

	$(".icon_button").click(clickE).hover(hvrInE, hvrOutE);
})();


/*
 * Adds functionality to arrow buttons. Switches between markers on map in
 * a bottom to top fashion. Once the last marker is passed, goes to the next
 * if there is one.
 */
(function() {
    $("#right_arrow").click(function() {
        var i = 0;
        var sldr = $("#slider");
        var yr = parseInt(sldr.val());

        while (i < displayed.length && displayed[i] != selected)
            i++;

        if (i < displayed.length - 1) {
        	displayed[i+1].fire('click');
        }
        else if (yr < END_YR + 1) {
        	changeYear(null, yr + 1);
        	sldr.val(yr + 1);
        }
    });
    
    $("#left_arrow").click(function() {
        var i = 0;
        var sldr = $("#slider");
        var yr = parseInt(sldr.val());
       
        while (i < displayed.length && displayed[i] != selected)
            i++;
        
        if (i > 0) {
        	displayed[i-1].fire('click');
        }
        else if (yr > BEGIN_YR) {
        	changeYear(null, yr - 1);
        	sldr.val(yr - 1);
        	displayed[displayed.length - 1].fire('click');
        }
    });
})();
 

/*
 * Load markers and display first year.
 */
(function() {
	var FISTS = [
		L.icon({iconUrl: IC_PTH + 'fst_un.png'}), // Unselected icon.
		L.icon({iconUrl: IC_PTH + 'fst_sel.png'}) // Selected icon.
	];
	var BRUSHES = [
		L.icon({iconUrl: IC_PTH + 'brsh_un.png'}),
		L.icon({iconUrl: IC_PTH + 'brsh_sel.png'})
	];
	var DOLLARS = [
		L.icon({iconUrl: IC_PTH + 'dllr_un.png'}),
	    L.icon({iconUrl: IC_PTH + 'dllr_sel.png'})
	];
	var GLOBES = [
		L.icon({iconUrl: IC_PTH + 'glb_un.png'}),
	    L.icon({iconUrl: IC_PTH + 'glb_sel.png'})
	];
	var SCHOOLS = [
		L.icon({iconUrl: IC_PTH + 'schl_un.png'}),
		L.icon({iconUrl: IC_PTH + 'schl_sel.png'})
	];
	var UNKNOWN = [
		L.icon({iconUrl: IC_PTH + 'unkn_un.png'}),
		L.icon({iconUrl: IC_PTH + 'unkn_sel.png'})
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
		var e = SPREADSHEET[SHEET_NM][this.EVENT_INDEX];
		var end = (e[E_END] == "") ? "?" : e[E_END];
		var timeSpan = (e[E_STRT] == end) ? e[E_STRT] : e[E_STRT] + " - " + end;
		var ANIMATE_TIME = 150; // Change to adjust time for description to change.
		var cptn = (e[E_CPTN] == "") ? "" : '<i>Image:</i>   ' + e[E_CPTN];
		var imagePath = "images/historical/" + e[E_NAME] + IMG_EXT;

		$("#street_view iframe").attr("src", e[E_STVW] || "");
		$("#hist_img").attr("src", imagePath)
		$("#img_link").attr("href", imagePath).attr("data-title", cptn);

		if (speed.fast) {
			$("#desc_title").text(e[E_NAME]);
			$("#info").text(timeSpan + "   ::   " + e[E_ADDR]);
			$("#desc").text(e[E_DESC]);
			$("#src").text(e[E_SRC]);
			$("#cptn").html(cptn);
		}
		else {
			$("#desc_body").fadeOut(ANIMATE_TIME, function() {
				$("#info").text(timeSpan + "   ::   " + e[E_ADDR]);
				$("#desc").text(e[E_DESC]);
				$("#src").text(e[E_SRC]);
				$("#cptn").html(cptn);
				$(this).fadeIn(ANIMATE_TIME)
			});
			$("#desc_title").slideUp(ANIMATE_TIME, function() {
				$(this).text(e[E_NAME]).slideDown(ANIMATE_TIME);
			});
		}
	};

	
	var TOOLTIP_OPTIONS = {
		opacity: 0.8,
		offset: L.point(12,10),
		className: 'tooltip'
	};

	// Populate ALL_MARKERS.
	for (i = 0; i < SPREADSHEET[SHEET_NM].length; i++) {
		var e = SPREADSHEET[SHEET_NM][i];

		if (e[E_STRT] && e[E_LAT] && e[E_LONG]) {
			// To add a marker, it must have a start date and a position.
			var marker = L.marker([e[E_LAT], e[E_LONG]]);
			var start = e[E_STRT] - BEGIN_YR;

			switch (e[E_LBL]) {
				case POL:  marker.ICONS = FISTS;   break;
				case ART:  marker.ICONS = BRUSHES; break;
				case BUS:  marker.ICONS = DOLLARS; break;
				case EDU:  marker.ICONS = SCHOOLS; break;
				case INTR: marker.ICONS = GLOBES;  break;
				default:   marker.ICONS = UNKNOWN; break; // No label entered for it.
			}
			marker.setIcon(marker.ICONS[0]);
			marker.EVENT_INDEX = i;
			marker.on('click', iconFlip);
			if ($(window).width() >= MBL_THRESH) {
			    marker.bindTooltip(e[E_NAME], TOOLTIP_OPTIONS); // Tooltip not needed for mobile
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


	// Sort all the marker arrays on latitude. Good for navigating with arrows.
	var compareMarkers = function(a, b) {
		return a.getLatLng().lat - b.getLatLng().lat;
	}

	for (i = 0; i < ALL_MARKERS.length; i++) {
		ALL_MARKERS[i].sort(compareMarkers);
	}

	eventQuery(BEGIN_YR);
})();