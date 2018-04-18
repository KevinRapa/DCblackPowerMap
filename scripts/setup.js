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

    This will only process and add elements to the map if they have a valid start year,
    latitude, and longitude. In addition, because there are a large amount of incomplete
    elements near the end, the site will only process events up to a certain one. This
    is held in a local variable LAST_ENTRY near the bottom. If all/more events should be
    processed because more have been completed, update this variable to the new event name,
    or set it to 'null' if all events should be processed.

    Author: Kevin Rapa
    Email:  kevjrapa@gmail.com
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
    // Indexed by year - BEGIN_YR + offset.
    map.ALL_MARKERS = new Array(NUM_YEARS + 1); 

    for (var i = 0, len = map.ALL_MARKERS.length; i < len; i++) {
        map.ALL_MARKERS[i] = [];
    }    

    // Resets currently selected marker to unselected and selects [newMarker]
    map.setSelected = function(newMarker) {
        if (this.selected) {
            this.selected
                .remove()
                .setIcon(this.selected.ICONS[0])
                .addTo(this);
        }
        this.selected = newMarker;
    };
    
    // Switches up all markers on the map based on the year and type (If type is defined).
    map.eventQuery = function(year, type) {
        var bounds = [];

        // Reset map
        this.setSelected(null);
        for (var marker of this.displayed) {
            marker.remove();
        }
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
        if (window.compactMode) {
            if (this.displayed.length) {
                $('#mbl_marker_slider')
                    .val(0)
                    .attr('max', this.displayed.length - 1)
                    .show();
            } 
            else {
                $('#mbl_marker_slider').hide();
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
(function() {
    var initTransform = function() {
        this.compactMode = ! this.compactMode;

        if ($("#street_view").css('display') != 'none') {
            $("#street_view_button").trigger('click', NO_ANIMATION); // Prevents map seizing.
        } 
        return $("#mbl_holder").detach();
    }

    var toCompactMode = function(holder) {
        holder.find("#legend")
            .attr("class", "mbl_legend")
            .after($("#right_box").detach());
        holder.find("#slider_box")
            .hide()
            .attr("class", "black_box");
        holder.find("#mbl_marker_slider")
            .attr("max", LF_MAP.displayed.length - 1)
            .val(LF_MAP.displayed.indexOf(LF_MAP.selected));
        holder.find(".mobile").show();
        $("#title_box")
            .after(holder)
            .attr("class", "mbl_title")
            .text("THE BLACK POWER MAP");
        $("#street_view_button").attr("class", "mbl_street_view_button");
        $(".purple_box").css("width", "650px");
        $("#intro_box span").text("vertical slider");

        (LF_MAP.displayed.length <= 1) && holder.find("#mbl_marker_slider").hide();
     }

     var toRegularMode = function(holder) {
        holder.find(".mobile").hide();
        holder.find("#legend").attr("class", "def_legend");
        holder.find("#street_view_button").attr("class", "def_street_view_button");
        holder.find("#slider_box")
            .attr("class", "black_box fade_group")
            .show();
        $("#title_box")
            .text("THE WASHINGTON, D.C. BLACK POWER MAP")
            .attr("class", "def_title");
        $("#intro_box span").text("arrow buttons");
        $(".purple_box").css("width", "1200px");    
        $("#right_pane").html(holder.find("#right_box"));
        $("#left_pane").html(holder);
     }

    $(window).resize(function() {
        var narrowEnough = $(this).width() < 1200; // 1200 is also used again at the bottom of the function.

        if (! this.compactMode && narrowEnough) {
            toCompactMode(initTransform());
        } 
        else if (this.compactMode && ! narrowEnough) {
            toRegularMode(initTransform());
        }
    }).ready(function() {
        $(".mobile").hide();
        $(this).trigger('resize');
    });
})();


// Changes year text and switches up markers. 
$("#slider").on("input", function() { 
    var yr = $(this).val();
    var text = (yr == ALL) ? 'All' : yr;
    
    $('#year').text(text);
    $('#mbl_year').text(text).animate({
        left: ((yr - BEGIN_YR) * MBL_YEAR_ALIGN_MAGIC + 10) + "px" // Aligns with mobile slider thumb.
    }, 15, 'linear');
    $("#mbl_slider").val(yr);
    $('.icon_text').css("font-style", "normal"); // Reset icon type filter.

    LF_MAP.eventQuery(yr);
});


$("#mbl_slider").on("input", function() {
    $("#slider").val($(this).val()).trigger('input');
});


$("#mbl_marker_slider").on("input", function() {
    LF_MAP.displayed[$(this).val()].fire('click', NO_ANIMATION);
});


// Animates legend icons when interacted with. Clicking them filters markers by event type.
(function() {
    var BOUNCE_TIME = 90;
    
    var click = function(e) {
        var btn = $(this),
            text = btn.next(),
            year = parseInt($("#year").text()) || ALL;
            
        for (var offset of ["-3px", "3px", "0"]) {
            btn.animate({bottom: offset}, BOUNCE_TIME);
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

    $(".icon_button").click(click).hover(hvrIn, hvrOut);
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
    var fadeTime = fast ? 0 : 150;
    var stView = $('#street_view');

    if (stView.css('display') == 'none') {
        $(this).text("To map"); // Into street view mode.

        $(".fade_group").fadeOut(fadeTime);
        $("#leaflet_map").fadeOut(fadeTime, function() {
            // 'If' needed since clicking the button quickly will mess things up.
            (stView.css('display') == 'none') && stView.fadeIn(fadeTime);
        });
    } 
    else {
        $(this).text("To street view"); // To map mode.

        stView.fadeOut(fadeTime, function() {
            if (stView.css('display') == 'none') {
                $("#leaflet_map").fadeIn(fadeTime);
                $(".fade_group").fadeIn(fadeTime);
            }
        });
    }
});


/*
 * Adds functionality to arrow buttons. Switches between markers on map in a bottom 
 * to top fashion. Once the last marker is passed, goes to the next/previous if there is one.
 */
(function() {
    var switchEvent = function() {
        var i = LF_MAP.displayed.indexOf(LF_MAP.selected);
        var yr = parseInt($("#slider").val());
        var delta = ($(this).attr("id") == "left_arrow") ? -1 : 1;

        if ((delta < 0 && i > 0) || (delta > 0 && i < LF_MAP.displayed.length - 1)) {
            LF_MAP.displayed[i + delta].fire('click');  // Move to next/prev marker
        } 
        else if ((delta < 0 && yr > BEGIN_YR) || (delta > 0 && yr < END_YR + 1)) {
            $("#slider").val(yr + delta).trigger('input'); // Move to next/prev year.

            (delta < 0) && LF_MAP.displayed[LF_MAP.displayed.length - 1].fire('click');
        }
    }
    $(".arrow").click(switchEvent);
})();


/*
 * Creates all the markers and displays first year when page loads.
 */
(function() {
    // Raw URL of the JSON and its title.
    var DATA_URL = 'https://raw.githubusercontent.com/KevinRapa/KevinRapa.github.io/master/scripts/all_data.json',
        DATA_TTL = "Black Power Events and Organizations";

    // Image used when no street view data is present.
    var ST_VIEW_ABSENT = "https://www.google.com/maps/embed?pb=!1m13!1m11!1m3!1d61129.78181151857!2d-77.0059245021" + 
                        "7232!3d38.89345203863472!2m2!1f0!2f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1522802214611";

    // Filepath and extension for the icons
    var IC_PTH = 'images/icons/', 
        IC_EXT = '.png';

    // Marker image file base names
    var FST = 'fst',        BRSH = 'brsh', 
        DLLR = 'dllr',      GLB = 'glb', 
        SCHL = 'schl',      UNKN = 'unkn';

    // Change if modifying spreadsheet field names.
    var E_STRT = "Start_Year",          E_END  = "End_Year",
        E_DESC = "Description",         E_NAME = "Event_Name",
        E_LAT  = "Latitude",            E_LONG = "Longitude",
        E_STVW = "St_View_URL",         E_LBL  = "Label",
        E_CPTN = "Picture_Caption",     E_SRC = "Sources";

    // Translates an event type to the name of the icon that represents it.
    var getIconName = function(eventType) {
        switch(eventType) {
            case "PA/IS":
                return GLB;
            case "BA":
                return BRSH;
            case "IS":
                return SCHL;
            case "BB":
                return DLLR;
            case "P/EP":
                return FST;
            default:
                return UNKN; 
        }
    };

    // Gets the JSON for the data and uses it in [callback]. 
    var requestData = function(callback) {
        var json = $.getJSON(DATA_URL);
        json.done(callback);
        json.fail(function(data) {
            $("#desc_body").scrollTop(0);
            $("#image_holder div").scrollTop(0);
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
    };

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
                LF_MAP.setSelected(this);
                this.remove().setIcon(this.ICONS[1]).addTo(LF_MAP);

                var index = this.EVENT_INDEX;

                requestData(function(_data) {
                    var e = _data[DATA_TTL][index];
                    var cptn = e[E_CPTN] ? '<i>Image:</i>   ' + e[E_CPTN] : "";
                    var imagePath = "images/historical/" + e[E_NAME] + '.jpg';
                    var animateTime = event.fast ? 0 : 150;

                    $("#street_view iframe").attr("src", e[E_STVW] || ST_VIEW_ABSENT);
                    $("#img_link")
                        .attr("href", imagePath)
                        .attr("data-title", cptn);
                    $("#hist_img")
                        .attr("src", "")
                        .css("height", "")
                        .attr("src", imagePath);
                    $("#desc_body").fadeOut(animateTime, function() {
                        $("#desc").text(e[E_DESC]);
                        $("#src").text("Sources: " + e[E_SRC]);
                        $("#cptn").html(cptn);
                        $(this).fadeIn(animateTime);
                    });
                    $("#desc_title").slideUp(animateTime, function() {
                        $(this).text(e[E_NAME]).slideDown(animateTime);
                    });
                });

                $("#desc_body").scrollTop(0);
                $("#image_holder div").scrollTop(0);
            }
        };

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
                return pairs[getIconName(eventType)];
            };
        })();

        // Populate ALL_MARKERS, an array of lists holding event icons.
        for (var i = 0, l = data[DATA_TTL].length; i < l; i++) {
            var e = data[DATA_TTL][i];

            if (e[E_STRT] && e[E_LAT] && e[E_LONG]) {
                // To add a marker, it must have a start date and a position.
                var marker = L.marker([e[E_LAT], e[E_LONG]]);
                var timeSpan = 0;

                marker.ICONS = getIconPair(e[E_LBL]);
                marker.EVENT_INDEX = i; // An index to find the event in the spreadsheet.
                marker.TYPE = e[E_LBL]; // Caches type so that no data request is needed in eventQuery().
                marker.setIcon(marker.ICONS[0]); 
                marker.on('click', switchEvent);     
                marker.bindTooltip(e[E_NAME], TOOLTIP_OPTIONS);
                
                if (e[E_END] == 'present') {
                    timeSpan = LF_MAP.ALL_MARKERS.length;
                } 
                else if (parseInt(e[E_END])) {
                    timeSpan = e[E_END] - e[E_STRT];
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
            requestData(function(data) {
                var name = getIconName(data[DATA_TTL][LF_MAP.selected.EVENT_INDEX][E_LBL]);
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
