/*
	This script sets up snf handles the page. Includes:
 		1. Listener functions assigned to every button, icon, and slider
 		2. Screen resize function
 		3. Function for querying icons to add to the map by year aand type
 		4. Populates an array with lists of events and assigns each event icon
 	   	   with images and an index to pull items from the spreadsheet file.
 
 	To update the data, the Github page holding the data in JSON form must be updated.
 	Follow these steps:
 		1. In Google Sheets, go to 'Add-ons'->'Export Sheet Data'->'Open sidebar'.
 		2. Make sure the format is 'JSON' and Select Sheet(s) is set to 'Current sheet only'. 
		3. The only box that should be selected is 'Export sheet arrays' under the 'JSON' section
		4. Click export and copy all the text in the link.
		5. Go to the page that the data is being held. Right now it is:
			https://github.com/KevinRapa/KevinRapa.github.io/edit/master/scripts/all_data.json
		6. Click edit. It looks like a little pencil icon at the top-right of the data.
		7. Replace all the data by pasting the new copied data.
		8. Click 'Commit changes' at the bottom.
		9. In several minutes the website should update.

	The URL reached after clicking the 'Raw' button on the Github page for the data is the
	one that should be used, not the URL of the Github page itself!

	If any field names or naming conventions on the spreadsheet are changed, they must be
	updated here too. This goes the same for the name of the spreadsheet, and file names or
	extensions, etc.

	Author: Kevin Rapa
*/

var BEGIN_YR = 1961;
var END_YR = 1995;
var ALL = END_YR + 1; // '+ 1' since last index is used to display all markers.
var NUM_YEARS = END_YR - BEGIN_YR + 1;
var NO_ANIMATION = {fast: true}; // Stops animation from happening when event changes.
var MBL_YEAR_ALIGN_MAGIC = (570 - 80) / NUM_YEARS; // mbl_slider width - thumb width.

window.compactMode = false;

/*
 * Sets up the map and adds it to the page.
 * To get new map tiles, visit https://leaflet-extras.github.io/leaflet-providers/preview/
 */
var LF_MAP = (function() {
	var map = L.map('leaflet_map', {
		zoomSnap: 0,
		zoomDelta: 0.6,
		minZoom: 8,
		layers: L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png')
	});

	var boundsOptions = {
		maxZoom: 15,
		paddingBottomRight: L.point(80,80),
		paddingTopLeft: L.point(25,25)
	};

	map.displayed = [];  // All icons currently being displayed on the map.
	map.selected = null; // The currently selected marker.

	// A list of lists, each holding events falling within the same year. Events may appear more than once.
	map.ALL_MARKERS = (function() {
		var arr = new Array(NUM_YEARS + 1); // Indexed by year - BEGIN_YR + j.

		for (var i = 0, len = arr.length; i < len; i++) {
			arr[i] = [];
		}	

		return arr;
	})();

	//Resets currently selected marker to unselected.
	map.resetSelected = function() {
	    if (this.selected) {
			this.selected
				.remove()
				.setIcon(this.selected.ICONS[0])
				.addTo(this);
		}
	};
	
	// Switches up all markers on the map based on the year and type (If type is defined).
	map.eventQuery = function(year, type) {
		var bounds = [];
		var mrkrSldr = $('#mbl_marker_slider');

		// Reset map
		this.resetSelected();
		for (var marker of this.displayed) {
			marker.remove();
		}
		this.selected = null;
		this.displayed = [];

		// Add the new markers
		for (var marker of this.ALL_MARKERS[year - BEGIN_YR]) {
			if (! type || marker.TYPE == type) {
	    		this.displayed.push(marker);
	    		marker.addTo(this);
	    		bounds.push(marker.getLatLng());
		    }
		}

		// Fit the view to the scope of the markers
		if (bounds.length) {
			this.fitBounds(bounds, boundsOptions);
			this.displayed[0]
				.fire('click', NO_ANIMATION)
				.closeTooltip();
		}

		// Display slider for markers if mobile mode and >1 markers.
		if (mrkrSldr) {
			if (this.displayed.length > 1) {
				mrkrSldr
					.val(0)
					.attr('max', this.displayed.length - 1)
					.show();
			} 
			else {
				mrkrSldr.hide();
			}
		}
	};

	return map;
})();


/*
 * Transforms page into mobile view. Basically moves the right half of the page into 
 * the left half, then centers the new block. Also swaps the slider to compactMode 
 * version. If street view is showing, first resets back to map or else map SEIZES.
 */
$(window).resize(function() {
	var narrowEnough = $(this).width() < 1200; // 1200 is also used again at the bottom of the function.

	if (! this.compactMode && narrowEnough) {
		// Transforms into compact mode.
		this.compactMode = ! this.compactMode;
		var sldr = $("#slider");
		var yr = parseInt(sldr.val());
		var holder = $("#mbl_holder");

		if (holder.find("#street_view").css('display') != 'none') {
			$("#street_view_button").trigger('click', NO_ANIMATION); // Prevents map seizing.
		} 

		holder.detach();
		holder.find("#legend")
			.attr("class", "mbl_legend")
			.after($("#right_box").detach())
			.before('<div id="mbl_year" class="fade_group mobile">' + (yr == ALL ? 'All' : yr) +
					'</div><input type="range" id="mbl_slider" class="fade_group mobile" min="1961" max="' 
					+ ALL + '" value="' + yr + '"/>')
			.prev("#mbl_slider").on('input', function() {
				sldr.val($(this).val()).trigger('input');
			})
			.siblings("#mbl_year").css("left", 
				((yr - BEGIN_YR) * MBL_YEAR_ALIGN_MAGIC + 10) + "px"); // Align with slider thumb
			
		holder.find("#slider_box")
			.hide()
			.before('<input type="range" id="mbl_marker_slider" class="fade_group mobile" min="0" max="' 
				+ (LF_MAP.displayed.length - 1) + '" value="' + LF_MAP.displayed.indexOf(LF_MAP.selected) 
				+ '"></input>')
			.prev("#mbl_marker_slider").on("input", function() {
				LF_MAP.displayed[$(this).val()].fire('click', NO_ANIMATION);
			});

		$("#title_box")
			.after(holder)
			.attr("class", "mbl_title")
			.text("THE BLACK POWER MAP");

		if (LF_MAP.displayed.length <= 1) {
			holder.find("#mbl_marker_slider").hide();
		}

		$(".purple_box").css("width", "650px");
		$("#intro_box span").text("vertical slider");
	} 
	else if (this.compactMode && ! narrowEnough) {
		// Transforms into desktop mode. Inverse of the above. 
		this.compactMode = ! this.compactMode;
		var holder = $("#mbl_holder");

		if (holder.find("#street_view").css('display') != 'none') {
			$("#street_view_button").trigger('click', true);
		}

		holder.detach();
		holder.find("#legend").attr("class", "def_legend");
		holder.find("#slider").val(holder.find("#mbl_slider").val());
		holder.find(".mobile").remove();
		holder.find("#slider_box").show();

		$("#title_box")
			.text("THE WASHINGTON, D.C. BLACK POWER MAP")
			.attr("class", "def_title");

		$("#intro_box span").text("arrow buttons");
		$(".purple_box").css("width", "1200px");	
		$("#right_pane").html(holder.find("#right_box"));
		$("#left_pane").html(holder);
	}
}).ready(function() {
	$(this).trigger('resize');
});


// Changes year text and switches up markers.
$("#slider").on("input", function() {
	var yr = $(this).val();
	var text = (yr == ALL) ? 'All' : yr
	
	$('#year').text(text);
	$('#mbl_year').text(text).animate({
		left: ((yr - BEGIN_YR) * MBL_YEAR_ALIGN_MAGIC + 10) + "px" // Aligns with mobile slider thumb.
	}, 15, 'linear');
	$('.icon_text').css("font-style", "normal"); // Reset icon type filter.

	LF_MAP.eventQuery(yr);
});


// Animates legend icons when interacted with. Clicking them filters markers by event type.
(function() {
	var BOUNCE_TIME = 90;
	
	var click = function(e) {
    	var btn = $(this),
    		text = btn.next(),
    		year = parseInt($("#year").text()) || ALL;
    		
    	for (var j of ["-3px", "3px", "0"]) {
    		btn.animate({bottom: j}, BOUNCE_TIME);
    	}
    			
        if ($("#street_view").css('display') == 'none') {
    		// Filters by event type, else reset the filter
    		if (text.css("font-style") == "normal") {
    			$(".icon_text").css("font-style", "normal");
    			text.css("font-style", "oblique");
    			LF_MAP.eventQuery(year, $(this).attr('id'));
    		} 
    		else {
    			text.css("font-style", "normal");
    			LF_MAP.eventQuery(year);
    		}
	    }
	};
	var hvrIn = function() {
		$(this).animate({bottom: "4px"}, BOUNCE_TIME);
	};
	var hvrOut = function() {
		$(this).animate({bottom: "0"}, BOUNCE_TIME);
	};

	$(".icon_button")
		.click(click)
		.hover(hvrIn, hvrOut);
})();


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
	var stView = $('#street_view');

	if (stView.css('display') == 'none') {
		$(this).text("To map");
		$(".fade_group").fadeOut(FADE_TIME);
		$("#leaflet_map").fadeOut(FADE_TIME, function() {
			if (stView.css('display') == 'none') {
				// 'If' needed since clicking the button quickly will mess things up.
				stView.fadeIn(FADE_TIME);
			}
		});
	} 
	else {
		$(this).text("To street view");

		if (fast) {
			stView.hide(0, function() {
				if (stView.css('display') == 'none') {
					$("#leaflet_map").show();
					$(".fade_group").show();
				}
			});
		} 
		else {
			stView.fadeOut(FADE_TIME, function() {
				if (stView.css('display') == 'none') {
					$("#leaflet_map").fadeIn(FADE_TIME);
					$(".fade_group").fadeIn(FADE_TIME);
				}
			});
		}
	}
});


/*
 * Adds functionality to arrow buttons. Switches between markers on map in a bottom 
 * to top fashion. Once the last marker is passed, goes to the next/previous if there is one.
 */
$(".arrow").click(function() {
    var i = LF_MAP.displayed.indexOf(LF_MAP.selected);
    var yr = parseInt($("#slider").val());
    var delta = ($(this).attr("id") == "left_arrow") ? -1 : 1;

    if ((delta < 0 && i > 0) || (delta > 0 && i < LF_MAP.displayed.length - 1)) {
    	LF_MAP.displayed[i + delta].fire('click');
    } 
    else if ((delta < 0 && yr > BEGIN_YR) || (delta > 0 && yr < END_YR + 1)) {
    	$("#slider").val(yr + delta).trigger('input');

    	if (delta < 0) {
    		LF_MAP.displayed[LF_MAP.displayed.length - 1].fire('click');
    	}
    }
});


/*
 * Creates all the markers and displays first year when page loads.
 */
(function() {
	// Raw URL of the JSON and its title.
	var DATA_URL = 'https://raw.githubusercontent.com/KevinRapa/KevinRapa.github.io/master/scripts/all_data.json',
		DATA_TTL = "Black Power Events and Organizations";

	// Caption used in pop-up window when there's no historical image.
	var NO_IMG_CAPTION = "This event does not have an image yet. Contributions of any kind are welcome. If you have an " +
						"image to contribute, please email George Derek Musgrove at gmusgr1@umbc.edu."

	// Image used when no street view data is present.
	var ST_VIEW_ABSENT = "https://www.google.com/maps/embed?pb=!1m13!1m11!1m3!1d61129.78181151857!2d-77.0059245021" + 
						"7232!3d38.89345203863472!2m2!1f0!2f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1522802214611"

	// Filepath and extension for the icons
	var IC_PTH = 'images/icons/', 
		IC_EXT = '.png';

	// Marker image file base names
	var FST = 'fst',		BRSH = 'brsh', 
		DLLR = 'dllr', 		GLB = 'glb', 
		SCHL = 'schl',		UNKN = 'unkn';

	// Change if modifying the names of the event types
	var INTR = "PA/IS", 	ART = "BA",
		BUS = "BB", 		EDU = "IS",
		POL = "P/EP";

	// Change if modifying spreadsheet field names.
	var E_STRT = "Start_Year", 			E_END  = "End_Year",
		E_DESC = "Description", 		E_NAME = "Event_Name",
		E_LAT  = "Latitude",			E_LONG = "Longitude",
		E_STVW = "St_View_URL",			E_LBL  = "Label",
		E_CPTN = "Picture_Caption",		E_SRC = "Sources";


	// Gets the JSON for the data and uses it in [callback]. 
	var requestData = function(callback) {
		var json = $.getJSON(DATA_URL);
		json.done(callback);
		json.fail(function(data) {
			$("#desc_body").scrollTop(0);
			$("#image_holder div").scrollTop(0);

			// Display some error info.
			$("#street_view iframe").attr("src", ST_VIEW_ABSENT);
			$("#img_link").attr("href", "");
			$("#hist_img")
				.css("height", "")
				.attr("src", "/images/icons/unkn.png");
			$("#desc_title").text("Hmmm... Something went wrong.");
			$("#desc").text("Looks like we encountered a problem getting the event data.");
			$("#src").text("");
			$("#cptn").html("");
		});
	}

	requestData(function(data) {
		var TOOLTIP_OPTIONS = {
			opacity: 0.8,
			offset: L.point(10,10),
			className: 'tooltip'
		};

		// Website will not process events after this one. Set to null if all events should be processed.
		var LAST_ENTRY = "Sisterspace and Books"; 

		// Gets the new event and updates all the info on the screen.
		var switchEvent = function(event) {
			if (this != LF_MAP.selected) {
				// Change currently selected icon.
				LF_MAP.resetSelected();
				this.remove().setIcon(this.ICONS[1]).addTo(LF_MAP);
				LF_MAP.selected = this;

				var index = this.EVENT_INDEX;

				requestData(function(d) {
					var e = d[DATA_TTL][index];
					var cptn = e[E_CPTN] ? '<i>Image:</i>   ' + e[E_CPTN] : "";
					var imagePath = "images/historical/" + e[E_NAME] + '.jpg';

					$("#street_view iframe").attr("src", e[E_STVW] || ST_VIEW_ABSENT);
					$("#img_link")
						.attr("href", imagePath)
						.attr("data-title", cptn);
					$("#hist_img")
						.attr("src", "")
						.css("height", "")
						.attr("src", imagePath);

					if (event.fast) {
						$("#desc_title").text(e[E_NAME]);
						$("#desc").text(e[E_DESC]);
						$("#src").text("Sources: " + e[E_SRC]);
						$("#cptn").html(cptn);
					} 
					else {
						var ANIMATE_TIME = 150;

						$("#desc_body").fadeOut(ANIMATE_TIME, function() {
							$("#desc").text(e[E_DESC]);
							$("#src").text("Sources: " + e[E_SRC]);
							$("#cptn").html(cptn);
							$(this).fadeIn(ANIMATE_TIME);
						});
						$("#desc_title").slideUp(ANIMATE_TIME, function() {
							$(this).text(e[E_NAME]).slideDown(ANIMATE_TIME);
						});
					}
				});

				$("#desc_body").scrollTop(0);
				$("#image_holder div").scrollTop(0);
			}
		}

		// Returns a pair of icons for use by a marker to switch between selected and unselected.
		var getIconPair = (function() {
			var pairs = {};

			for (var ic of [FST, BRSH, DLLR, GLB, SCHL, UNKN]) {
				pairs[ic] = [
					L.icon({iconUrl: IC_PTH + ic + '_un' + IC_EXT}), 
					L.icon({iconUrl: IC_PTH + ic + '_sel' + IC_EXT})
				];
			}

			return function(eventType) {
				switch (eventType) {
				case POL:  
					return pairs[FST];
				case ART:  
					return pairs[BRSH];
				case BUS:  
					return pairs[DLLR];
				case EDU:  
					return pairs[SCHL];
				case INTR: 
					return pairs[GLB];
				default:   
					return pairs[UNKN]; // No label entered for it.
				}
			};
		})();

		// Populate ALL_MARKERS, an array of lists holding event icons.
		for (var i = 0, l = data[DATA_TTL].length; i < l; i++) {
			var e = data[DATA_TTL][i];

			if (e[E_STRT] && e[E_LAT] && e[E_LONG]) {
				// To add a marker, it must have a start date and a position.
				var marker = L.marker([e[E_LAT], e[E_LONG]]);
				var timeSpan = 0;

				marker.ICONS = getIconPair(e[E_LBL]); // Assign a pair of images [unselected, selected] to each icon.
				marker.EVENT_INDEX = i; // An index to find the event in the spreadsheet.
				marker.TYPE = e[E_LBL];
				marker.setIcon(marker.ICONS[0]); 
				marker.on('click', switchEvent);	 
				marker.bindTooltip(e[E_NAME], TOOLTIP_OPTIONS);
				
				if (e[E_END] == 'present') {
					timeSpan = LF_MAP.ALL_MARKERS.length;
				} 
				else if (parseInt(e[E_END])) {
					timeSpan = e[E_END] - e[E_STRT]
				}

				// Add this to every year it falls into.
				for (var start = e[E_STRT] - BEGIN_YR, j = 0; j <= timeSpan && start + j < NUM_YEARS; j++) {
					LF_MAP.ALL_MARKERS[start + j].push(marker);
				}

				LF_MAP.ALL_MARKERS[NUM_YEARS].push(marker); // All markers are put in final slot.
			}

			if (LAST_ENTRY && e[E_NAME] == LAST_ENTRY) {
				break; // Entries after LAST_ENTRY are mostly incomplete.
			}
		}

		// Sort the markers in each year by latitude for intuitive navigation.
		(function() {
			var byLat = function(m1, m2) {
				return m1.getLatLng().lat - m2.getLatLng().lat;
			};
			for (var year of LF_MAP.ALL_MARKERS) {
				year.sort(byLat);
			}
		})();

		LF_MAP.eventQuery(BEGIN_YR);
	});

	// If a historical image fails to load, load a standard image.
	window.addEventListener('error', function(err) {
		// Caption used in pop-up window when there's no historical image.
		var NO_IMG_CAPTION = "This event does not have an image yet. Contributions of any kind are welcome. If you have an " +
							"image to contribute, please email George Derek Musgrove at gmusgr1@umbc.edu.";

		if (err.target.id == "hist_img") {
			$.getJSON(DATA_URL).done(function(data) {
				var name = (function() {
					var event = data[DATA_TTL][LF_MAP.selected.EVENT_INDEX];

					switch(event[E_LBL]) {
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
				var filePath = IC_PTH + name + IC_EXT;
				var img = $("#hist_img");

				// Conditional is to help prevent image stuttering when switching events.
				if (img.attr("src") != filePath) {
					img.css("height", "99%")
					   .attr("src", filePath);
				}
				$("#img_link")
					.attr("href", filePath)
					.attr("data-title", NO_IMG_CAPTION);
			});
		}
	}, true);
})();