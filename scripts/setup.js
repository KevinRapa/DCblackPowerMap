/*
	This script sets up the whole page and assigns listener functions. The 
	spreadsheet data is kept in a separate file. Code on this page includes:
 		1. Listener functions assigned to every button, icon, and slider
 		2. Screen resize function
 		3. Function for querying icons to add to the map by year aand type
 		4. Populates an array with lists of events and assigns each event icon
 	   	   with images and an index to pull items from the spreadsheet file.
 
	Author: Kevin Rapa
*/

var BEGIN_YR = 1961,
	END_YR = 1995;

var DESKTOP_TTL = "THE WASHINGTON, D.C. BLACK POWER MAP",
	MOBILE_TTL = "THE BLACK POWER MAP";

var ST_VIEW_UNSEL = "To street view",
	ST_VIEW_SEL = "To map";

var MBL_THRESH = 1200; // Width at which device is considered 'compactMode'.

// For fitting the markers inside the map so that none are obstructed.
var BOUNDS_OPTIONS = {
	maxZoom: 15,
	paddingBottomRight: L.point(80,80),
	paddingTopLeft: L.point(25,25)
};

// Website will not process events after this one in the spreadsheet.
// Set to null if all events should be processed.
var LAST_ENTRY = "Sisterspace and Books"; 

// Change if modifying spreadsheet field names.
var E_STRT = "Start_Year",
	E_END  = "End_Year",
	E_ADDR = "Address",
	E_DESC = "Description",
	E_NAME = "Event_Name",
	E_LAT  = "Latitude",
	E_LONG = "Longitude",
	E_STVW = "St_View_URL",
	E_LBL  = "Label",
	E_CPTN = "Picture_Caption",
	E_SRC = "Sources";

// Change if modifying the names of the event types
var INTR = "PA/IS",
	ART = "BA",
	BUS = "BB",
	EDU = "IS",
	POL = "P/EP";	

// ---------------------------------------------------------------------

var ALL = END_YR + 1; // '+ 1' there since last index is used to display every marker.
var NUM_YEARS = END_YR - BEGIN_YR + 1;
var ALL_MARKERS = new Array(NUM_YEARS + 1); // Indexed by [year] - BEGIN_YR + offset.

var NO_ANIMATION = {fast: true}; // Stops animation from happening when event changes.
var MBL_YEAR_ALIGN_MAGIC = (570 - 80) / NUM_YEARS; // mbl_slider width - thumb width.
var compactMode = false;

for (i = 0; i < NUM_YEARS + 1; i++) {
	ALL_MARKERS[i] = []; // Each element holds a list of events that happen in same year.
}

/*
 * Adds the tile layer to the map, then adds the map to the page. Also initializes a few custom attributes
 * TO CHANGE MAP, VISIT https://leaflet-extras.github.io/leaflet-providers/preview/
 */
var MAP = L.map('leaflet_map', {
	zoomSnap: 0,
	zoomDelta: 0.6,
	minZoom: 8,
	layers: L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png')
});
MAP.displayed = [];  // All icons currently being displayed on the map.
MAP.selected = null; // The currently selected marker.
MAP.resetSelected = function() {
    if (this.selected) {
    	//Resets currently selected marker to unselected.
		this.selected.remove().setIcon(this.selected.ICONS[0]).addTo(MAP);
	}
}

/*
 * Transforms page into mobile view. Basically moves the right half of the page into 
 * the left half, then centers the new block. Also swaps the slider to compactMode 
 * version. If street view is showing, first resets back to map or else map SEIZES.
 */
$(window).resize(function() {
	if (! compactMode && $(this).width() < MBL_THRESH) {
		// Transforms into compact mode.
		compactMode = ! compactMode;
		var b = $("#street_view_button");
		var sldr = $("#slider");
		var yr = sldr.val();

		if (b.text() == ST_VIEW_SEL) {
			b.trigger('click', NO_ANIMATION); // Prevents map seizing.
		} 

		$("#legend")
			.after($("#right_box").detach())
			.before('<input type="range" id="mbl_slider" class="fade_group" \
					min="1961" max="' + ALL + '" value="' + yr + '"/>')
			.css("margin-bottom", "10px")
			.css("border", "none")
			.css("box-shadow", "none")
			.css("-moz-box-shadow", "none")
			.css("-webkit-box-shadow", "none");

		$("#title_box")
			.after($("#mbl_holder").detach())
			.text(MOBILE_TTL)
			.css("font-size", "48px")
			.css("margin-bottom", "5px");
        
		$("#slider_box")
			.css("visibility", "hidden")
			.before('<input type="range" id="mbl_marker_slider" class="fade_group" \
					min="0" max="' + (MAP.displayed.length - 1) + 
					'" value="' + MAP.displayed.indexOf(MAP.selected) + '"></input>');

		$("#mbl_slider")
			.before('<div id="mbl_year" class="fade_group">' + 
					(yr == ALL ? 'All' : yr) + '</div>')
			.on('input', function() {
				sldr.val($(this).val()).trigger('input');
			});
        
		var mbl_mrkr_sldr = $("#mbl_marker_slider")
			.on("input", function() {
				MAP.displayed[$(this).val()].fire('click', NO_ANIMATION);
			});

		if (MAP.displayed.length <= 1) {
			mbl_mrkr_sldr.hide();
		}

		$("#mbl_year").css("left", 
			((yr - BEGIN_YR) * MBL_YEAR_ALIGN_MAGIC + 10) + "px"); // Aligns with slider thumb
		$(".purple_box").css("width", "650px");
		$("#intro_box span").text("vertical slider");
	}
	else if (compactMode && $(this).width() >= MBL_THRESH) {
		// Transforms into desktop mode. Inverse of the above. 
		compactMode = ! compactMode;
		var b = $("#street_view_button");
		var shadow = "5px 5px 5px rgb(15,15,15)";
		var mblSldr = $("#mbl_slider");

		if(b.text() == ST_VIEW_SEL) {
			b.trigger('click', true);
		}

		$("#intro_box span").text("arrow buttons");
		$(".purple_box").css("width", MBL_THRESH + "px");
		$("#legend")
			.css("margin-bottom", "")
			.css("border", "5px solid rgb(200,191,176)")
			.css("box-shadow", shadow)
			.css("-moz-box-shadow", shadow)
			.css("-webkit-box-shadow", shadow);
		$("#slider").val(mblSldr.val());
		mblSldr.off('input').detach();
		$("#mbl_year").detach();
		$("#mbl_marker_slider").detach();
		$("#slider_box").css("visibility", "visible");
		$("#title_box")
			.text(DESKTOP_TTL)
			.css("font-size", "50px")
			.css("margin-bottom", "0");
		$("#left_pane").html($("#mbl_holder").detach());
		$("#right_pane").html($("#right_box").detach());
	}
});


$(window).ready(function() {
	$("#street_view").hide();
	eventQuery(BEGIN_YR);
	$(this).trigger('resize');
});


/*
 * Removes each marker from the map, then populates the map with all events that 
 * fall in [year]. If [type] is defined, also checks that the event is same type.
 */
function eventQuery(year, type) {
	var bounds = []; // List of coordinates for map panning.
	var NEW_MARKERS = ALL_MARKERS[year - BEGIN_YR];
	var mbl_mrkr_sldr = $('#mbl_marker_slider');

	MAP.resetSelected();
	MAP.displayed.forEach(function(marker) {
		marker.remove();
	});
	MAP.selected = null;
	MAP.displayed = [];

	NEW_MARKERS.forEach(function(marker) {
		if (! type || JSON_DATA[marker.EVENT_INDEX][E_LBL] == type) {
    		MAP.displayed.push(marker);
    		marker.addTo(MAP);
    		bounds.push(marker.getLatLng());
	    }
	});

	if (bounds.length) {
		MAP.fitBounds(bounds, BOUNDS_OPTIONS);
		MAP.displayed[0].fire('click', NO_ANIMATION).closeTooltip();
	}

	if (mbl_mrkr_sldr) {
		if (MAP.displayed.length > 1) {
			mbl_mrkr_sldr.val(0).attr('max', MAP.displayed.length - 1).show();
		} else {
			mbl_mrkr_sldr.hide();
		}
	}
};


/*
 * Changes year text and switches up markers.
 */
$("#slider").on("input", function() {
	var yr = $(this).val();
	var text = yr == ALL ? 'All' : yr
	
	$('#year').text(text);
	$('#mbl_year').text(text).animate({
		left: ((yr - BEGIN_YR) * MBL_YEAR_ALIGN_MAGIC + 10) + "px" // Aligns with mobile slider thumb.
	}, 15, 'linear');
	$('.icon_text').css("font-style", "normal"); // Reset icon type filter.

	eventQuery(yr);
});


/*
 * Buttons that remove and restore the intro screen.
 */
$("#to_map").click(function() {
	$("#intro_box").slideUp();
	$("#intro_screen").delay(150).fadeOut();
});
$("#to_intro").click(function() {
	$("#intro_screen").fadeIn();
	$("#intro_box").delay(150).slideDown();
});


/*
 * Toggles between the map and the street view image.
 * If speed == null, then an animation happens. Otherwise, speed == NO_ANIMATION.
 * The animation can can the map to seize if it happens while going to compact mode.
 */
$("#street_view_button").click(function(e, fast) {
	var FADE_TIME = 150;
	var btn = $(this);

	if (btn.text() == ST_VIEW_UNSEL) {
		btn.text(ST_VIEW_SEL);
		$(".fade_group").fadeOut(FADE_TIME);
		$("#leaflet_map").fadeOut(FADE_TIME, function() {
			if (btn.text() == ST_VIEW_SEL) {
				// 'If' needed since clicking the button quickly will mess things up.
				$("#street_view").fadeIn(FADE_TIME);
			}
		});
	}
	else {
		btn.text(ST_VIEW_UNSEL);

		if (fast) {
			$("#street_view").hide(0, function() {
				if (btn.text() == ST_VIEW_UNSEL) {
					$("#leaflet_map").show();
					$(".fade_group").show();
				}
			});
		}
		else {
			$("#street_view").fadeOut(FADE_TIME, function() {
				if (btn.text() == ST_VIEW_UNSEL) {
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
	var BOUNCE_TIME = 90;
	
	var clickE = function(e) {
    	var btn = $(this),
    		text = btn.next(),
    		year = parseInt($("#year").text()) || ALL;
    		
    	["-3px", "3px", "0"].forEach(function(offset) {
    		btn.animate({bottom: offset}, BOUNCE_TIME);
    	})
    			
        if ($("#street_view_button").text() != ST_VIEW_SEL) {
    		// Filters by event type, else reset the filter
    		if (text.css("font-style") == "normal") {
    			$(".icon_text").css("font-style", "normal");
    			text.css("font-style", "oblique");
    			eventQuery(year, $(this).attr('id'));
    		}
    		else {
    			text.css("font-style", "normal");
    			eventQuery(year);
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
 * Adds functionality to arrow buttons. Switches between markers on map in a bottom 
 * to top fashion. Once the last marker is passed, goes to the next if there is one.
 */
$("#right_arrow").click(function() {
    var selectedIndex = MAP.displayed.indexOf(MAP.selected);
    var sldr = $("#slider");
    var yr = parseInt(sldr.val());

    if (selectedIndex < MAP.displayed.length - 1) {
    	MAP.displayed[selectedIndex+1].fire('click');
    }
    else if (yr < END_YR + 1) {
    	sldr.val(yr + 1).trigger('input');
    }
});
$("#left_arrow").click(function() {
    var selectedIndex = MAP.displayed.indexOf(MAP.selected);
    var sldr = $("#slider");
    var yr = parseInt(sldr.val());
    
    if (selectedIndex > 0) {
    	MAP.displayed[selectedIndex - 1].fire('click');
    }
    else if (yr > BEGIN_YR) {
    	sldr.val(yr - 1).trigger('input');
    	MAP.displayed[MAP.displayed.length - 1].fire('click');
    }
});
 

/*
 * Creates all the markers and displays first year when page loads.
 */
(function() {
	var PTH = 'images/icons/', 
		IC_EXT = '.png';

	// Icon file name postfixes and extension type.
	var UNSEL = '_un' + IC_EXT, 
		SEL = '_sel' + IC_EXT;

	// Marker image file base names
	var FST = 'fst', 
		BRSH = 'brsh', 
		DLLR = 'dllr', 
		GLB = 'glb', 
		SCHL = 'schl', 
		UNKN = 'unkn';

	var TOOLTIP_OPTIONS = {
		opacity: 0.8,
		offset: L.point(12,10),
		className: 'tooltip'
	};


	// Deselects currently selected marker, then selects this one.
	// [e] contains the attribute of NO_ANIMATION if it was passed.
	var ICON_FLIP = function(e) {
		if (MAP.selected == this) return; // User clicked the same one twice.

		// Change currently selected icon.
		MAP.resetSelected();
		this.remove().setIcon(this.ICONS[1]).addTo(MAP);
		MAP.selected = this;
		
		// Display all the event information.
		var e = JSON_DATA[this.EVENT_INDEX];
		var end = e[E_END] || "?";
		var timeSpan = (e[E_STRT] == end) ? e[E_STRT] : e[E_STRT] + " - " + end;
		var cptn = e[E_CPTN] ? '<i>Image:</i>   ' + e[E_CPTN] : "";
		var imagePath = "images/historical/" + e[E_NAME] + '.jpg';
		var img = $("#hist_img");

		$("#desc_body").scrollTop(0);
		$("#image_container div").scrollTop(0);

		// Display the modern day view or show an entire view of DC if there isn't one.
		$("#street_view iframe").attr("src", e[E_STVW] 
			|| "https://www.google.com/maps/embed?pb=!1m13!1m11!1m3!1d61129.\
				78181151857!2d-77.00592450217232!3d38.89345203863472!2m2!1f0\
				!2f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1522802214611");
		$("#img_link")
			.attr("href", imagePath)
			.attr("data-title", cptn);
		img.attr("src", imagePath);

		// Prevents image stuttering when using the arrow keys 
		// to move between successive events with no image.
		(img.attr("height") == "99%") && img.css("height", "");

		if (e.fast) {
			$("#desc_title").text(e[E_NAME]);
			$("#info").text(timeSpan + "   ::   " + e[E_ADDR]);
			$("#desc").text(e[E_DESC]);
			$("#src").text("Sources: " + e[E_SRC]);
			$("#cptn").html(cptn);
		}
		else {
			var ANIMATE_TIME = 150;

			$("#desc_body").fadeOut(ANIMATE_TIME, function() {
				$("#info").text(timeSpan + "   ::   " + e[E_ADDR]);
				$("#desc").text(e[E_DESC]);
				$("#src").text("Sources: " + e[E_SRC]);
				$("#cptn").html(cptn);
				$(this).fadeIn(ANIMATE_TIME);
			});
			$("#desc_title").slideUp(ANIMATE_TIME, function() {
				$(this).text(e[E_NAME]).slideDown(ANIMATE_TIME);
			});
		}
	};

	// Returns a pair of icons for use by a marker to switch between selected and unselected.
	var getIconPair = (function() {
		var PAIRS = {};

		[FST, BRSH, DLLR, GLB, SCHL, UNKN].forEach(function(ic) {
			PAIRS[ic] = [L.icon({iconUrl: PTH + ic + UNSEL}), L.icon({iconUrl: PTH + ic + SEL})];
		});

		return function(eventType) {
			switch (eventType) {
			case POL:  
				return PAIRS[FST];
			case ART:  
				return PAIRS[BRSH];
			case BUS:  
				return PAIRS[DLLR];
			case EDU:  
				return PAIRS[SCHL];
			case INTR: 
				return PAIRS[GLB];
			default:   
				return PAIRS[UNKN]; // No label entered for it.
			}
		};
	})();

	// Populate ALL_MARKERS, an array of lists holding event icons.
	for (var i = 0, l = JSON_DATA.length; i < l; i++) {
		var e = JSON_DATA[i];

		if (e[E_STRT] && e[E_LAT] && e[E_LONG]) {
			// To add a marker, it must have a start date and a position.
			var marker = L.marker([e[E_LAT], e[E_LONG]]);

			marker.ICONS = getIconPair(e[E_LBL]);
			marker.setIcon(marker.ICONS[0]); // Assign a pair of images [unselected, selected] to each icon.
			marker.on('click', ICON_FLIP);	 
			marker.EVENT_INDEX = i; 		 // An index to find event information in the spreadsheet data.
			
			if (! compactMode) {
			    marker.bindTooltip(e[E_NAME], TOOLTIP_OPTIONS);
			}
			
			(function() {
				// Add this to every year it falls into.
				var timeSpan = (function() {
					if (e[E_END] == 'present') {
						return ALL_MARKERS.length;
					} else if (parseInt(e[E_END])) {
						return e[E_END] - e[E_STRT]
					} else {
						return 0;
					}
				})();

				for (var j = e[E_STRT] - BEGIN_YR; j < NUM_YEARS && j <= timeSpan; j++) {
					ALL_MARKERS[j].push(marker);
				}

				ALL_MARKERS[NUM_YEARS].push(marker); // All markers are put in final slot.
			})();
		}

		if (LAST_ENTRY && e[E_NAME] == LAST_ENTRY) {
			break; // Entries after LAST_ENTRY are mostly incomplete.
		}
	}
	
	// If a historical image fails to load, load a standard image.
	window.addEventListener('error', function(err) {
		if (err.srcElement.id == "hist_img") {
			var name = (function() {
				var type = JSON_DATA[MAP.selected.EVENT_INDEX][E_LBL];

				switch(type) {
				case INTR:
					return GLB;
				case ART:
					return BRSH;
				case EDU:
					return SCHL;
				case BUS:
					return DLLR;
				case POL:
					return FST;
				default:
					return UNKN; 
				}
			})();
			var filePath = PTH + name + IC_EXT;

			$("#hist_img")
				.css("height", "99%")
				.attr("src", filePath);
			$("#img_link")
				.attr("href", filePath)
				.attr("data-title", "This event does not have an image yet. \
						Contributions of any kind are welcome. If you have an \
						image to contribute, please email George Derek \
						Musgrove at gmusgr1@umbc.edu.");
		}
	}, true);

	ALL_MARKERS.forEach(function(year) {
		year.sort(function(a, b) {
			return a.getLatLng().lat - b.getLatLng().lat; // Sort markers by latitude for easier navigation.
		});
	});
})();