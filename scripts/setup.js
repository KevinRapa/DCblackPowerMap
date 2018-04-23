/*
    This script sets up and handles the page. Includes:
        1. Listener functions assigned to every button, icon, and slider
        2. Screen resize function
        3. Function for querying icons to add to the map by year and type
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
    latitude, and longitude.

    Author: Kevin Rapa
    Email:  kevjrapa@gmail.com
*/

// If the page is in mobile mode.
window.compact = false;

// Namespace with options that may change.
var NS = (function(beginYr, endYR) {
    var numYrs = endYR - beginYr + 1; // last index is for displaying all markers.

    return {
        BEGIN_YR: beginYr,
        END_YR: endYR,
        NUM_YRS: numYrs,
        NO_ANIMATION: {fast: true},       // Argument for stopping animation.
        ALIGN_MAGIC: (570 - 80) / numYrs, // Aligns mbl_year. (mbl_slider width - thumb width). It just works.
        IMG_CONTAINER_HEIGHT: 370,        // Used to align images vertically in #hist_img

        MBL_TTL: 'THE BLACK POWER MAP',
        DEF_TTL: $('#title_box').text(),  // The website's title.
        DATA_URL: 'https://raw.githubusercontent.com/KevinRapa/KevinRapa.github.io/master/scripts/all_data.json',
        DATA_TTL: 'Black Power Events and Organizations',

        MAP_OPTIONS: {
            zoomSnap: 0,
            zoomDelta: 0.6,
            minZoom: 8,
            layers: L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png')
        },
        MAP_AUTOPAN_OPTIONS: {
            maxZoom: 15,
            paddingBottomRight: L.point(80,80),
            paddingTopLeft: L.point(25,25)
        },
        TOOLTIP_OPTIONS: {
            opacity: 0.8,
            offset: L.point(10,10),
            className: 'tooltip'
        }
    };
})(1961, parseInt($('#slider').attr('max') - 1));


/*
 * Sets up the map and adds it to the page.
 * To get new map tiles, visit https://leaflet-extras.github.io/leaflet-providers/preview/
 */
var LF_MAP = (function() {
    var map = L.map('leaflet_map', NS.MAP_OPTIONS);

    map.displayed = [];  // All icons currently being displayed on the map.
    map.selected = null; // The currently selected marker.

    // A list of lists, each holding events falling within the same year. Events may appear more than once.
    // Indexed by year - BEGIN_YR + offset.
    map.ALL_MARKERS = new Array(NS.NUM_YRS + 1); 

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
        for (var marker of this.ALL_MARKERS[year - NS.BEGIN_YR]) {
            if (! type || marker.TYPE == type) {
                this.displayed.push(marker);
                marker.addTo(this);
                bounds.push(marker.getLatLng());
            }
        }

        // Fit the view to the scope of the markers
        if (bounds.length) {
            this.fitBounds(bounds, NS.MAP_AUTOPAN_OPTIONS);
            this.displayed[0]
                .fire('click', NS.NO_ANIMATION)
                .closeTooltip();
        }

        // Display slider for markers if mobile mode and >1 markers.
        if (window.compact) {
            if (this.displayed.length > 1) {
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
 * the left half, then centers the new block. Also swaps the slider to compact 
 * version. If street view is showing, first resets back to map or else map SEIZES.
 */
(function() {
    var initTransform = function() {
        this.compact = ! this.compact;

        if ($('#street_view').css('display') != 'none') {
            $('#street_view_button').trigger('click', NS.NO_ANIMATION); // Prevents map seizing.
        } 
        return $('#mbl_holder').detach();
    }

    var toCompactMode = function(holder) {
        holder.find('#legend')
            .css('border-radius', '40px 40px 0 0')
            .attr('class', 'mbl_legend')
            .after($('#right_box').detach());
        holder.find('#slider_box')
            .hide()
            .attr('class', 'black_box');
        holder.find('#mbl_marker_slider')
            .attr('max', LF_MAP.displayed.length - 1)
            .val(LF_MAP.displayed.indexOf(LF_MAP.selected));
        holder.find('.mobile')
            .attr('class', 'fade_group mobile')
            .show();
        $('body').css('font-family', 'arial');
        $('#title_box')
            .after(holder)
            .attr('class', 'mbl_title')
            .text(NS.MBL_TTL);
        $('#street_view_button').attr('class', 'mbl_street_view_button');
        $('.purple_box').css('width', '650px');
        $('#intro_box span').text('vertical slider');

        (LF_MAP.displayed.length > 1) || holder.find('#mbl_marker_slider').hide();
    }

    var toRegularMode = function(holder) {
        holder.find('.mobile')
            .attr('class', 'mobile')
            .hide();
        holder.find('#legend')
            .css('border-radius', '0')
            .attr('class', 'def_legend');
        holder.find('#street_view_button').attr('class', 'def_street_view_button');
        holder.find('#slider_box')
            .attr('class', 'black_box fade_group')
            .show();
        $("body").css('font-family', 'serif');
        $('#title_box')
            .text(NS.DEF_TTL)
            .attr('class', 'def_title');
        $('#intro_box span').text('arrow buttons');
        $('.purple_box').css('width', '1200px');    
        $('#right_pane').html(holder.find('#right_box'));
        $('#left_pane').html(holder);
    }

    $(window).resize(function() {
        var narrowEnough = $(this).width() < 1200; // 1200 is also used again at the bottom of the function.

        if (! this.compact && narrowEnough) {
            toCompactMode(initTransform());
        } 
        else if (this.compact && ! narrowEnough) {
            toRegularMode(initTransform());
        }
    }).ready(function() {
        $(".mobile").hide();
        $(this).trigger('resize');
    });
})();


/*
 * Adds functionality to sliders. 
 */
$('#slider').on('input', function() { 
    var yr = $(this).val();
    var text = (yr == NS.END_YR + 1) ? 'All' : yr;
    
    $('#year').text(text);
    $('#mbl_year').text(text).animate({
        left: (((yr - NS.BEGIN_YR) * NS.ALIGN_MAGIC) + 'px') // Aligns with mobile slider thumb.
    }, 15, 'linear');
    $('#mbl_slider').val(yr);
    $('.icon_text').css('font-style', 'normal'); // Reset icon type filter.

    LF_MAP.eventQuery(yr);
});

$('#mbl_slider').on('input', function() {
    $('#slider').val($(this).val()).trigger('input');
});

$('#mbl_marker_slider').on('input', function() {
    LF_MAP.displayed[$(this).val()].fire('click', NS.NO_ANIMATION);
});


/*
 * Animates legend icons when interacted with. Clicking them filters markers by event type.
 */
(function() {
    var BOUNCE_TIME = 90;
    
    var click = function(e) {
        var btn = $(this),
            text = btn.next(),
            year = parseInt($('#year').text()) || NS.END_YR + 1;

        for (var offset of ['-3px', '3px', '0']) {
            btn.animate({bottom: offset}, BOUNCE_TIME);
        }
                
        if ($('#street_view').css('display') != 'none') {
            $('#street_view_button').trigger('click');
        }
        
        // Filters by event type, else reset the filter
        if (text.css('font-style') == 'normal') {
            $('.icon_text').css('font-style', 'normal');
            text.css('font-style', 'oblique');
            LF_MAP.eventQuery(year, $(this).attr('id'));
        } 
        else {
            text.css('font-style', 'normal');
            LF_MAP.eventQuery(year);
        }
    };
    var hvrIn = function() {
        $(this).animate({bottom: '4px'}, BOUNCE_TIME);
    };
    var hvrOut = function() {
        $(this).animate({bottom: '0'}, BOUNCE_TIME);
    };

    $('.icon_button').click(click).hover(hvrIn, hvrOut);
})();


/* 
 * Buttons that remove and restore the intro screen.
 */
$('#to_map').click(function() {
    $('#intro_box').slideUp();
    $('#intro_screen').delay(150).fadeOut();
});
$('#to_intro').click(function() {
    $('#intro_screen').fadeIn();
    $('#intro_box').delay(150).slideDown();
});


/*
 * Toggles between the map and the street view image.
 * If speed == null, then an animation happens. Otherwise, speed == NO_ANIMATION.
 * The animation can can the map to seize if it happens while going to compact mode.
 */
$('#street_view_button').click(function(e, fast) {
    var fadeTime = fast ? 0 : 150;
    var stView = $('#street_view');

    if (stView.css('display') == 'none') {
        $(this).text('To map'); // Into street view mode.

        $('.fade_group').fadeOut(fadeTime);
        $('#leaflet_map').fadeOut(fadeTime, function() {
            // 'If' needed since clicking the button quickly will mess things up.
            (stView.css('display') == 'none') && stView.fadeIn(fadeTime);
            window.compact && $('#legend').css('border-radius', '0');
        });
    } 
    else {
        $(this).text('To street view'); // To map mode.

        stView.fadeOut(fadeTime, function() {
            if (stView.css('display') == 'none') {
                window.compact && $('#legend').css('border-radius', '40px 40px 0 0');
                $('#leaflet_map').fadeIn(fadeTime);
                $('.fade_group').fadeIn(fadeTime);
            }
        });
    }
});


/*
 * Aligns a historical image vertically (if too short) when it is loaded.
 */
$('#hist_img').on('load', function(year) {
    var diff = NS.IMG_CONTAINER_HEIGHT - $(this).height();

    $(this).css('top', (diff <= 0 ? 0 : diff / 2) + 'px')
    $('#image_container div').fadeTo(0, 1);
});


/*
 * Adds functionality to arrow buttons. Switches between markers on map in a bottom 
 * to top fashion. Once the last marker is passed, goes to the next/previous if there is one.
 */
(function() {
    var switchEvent = function() {
        var marker = LF_MAP.displayed.indexOf(LF_MAP.selected);
        var yr = parseInt($('#slider').val());
        var delta = ($(this).attr('id') == 'left_arrow') ? -1 : 1;

        if ((delta < 0 && marker > 0) || (delta > 0 && marker < LF_MAP.displayed.length - 1)) {
            LF_MAP.displayed[marker + delta].fire('click');  // Move to next/prev marker
        } 
        else if ((delta < 0 && yr > NS.BEGIN_YR) || (delta > 0 && yr < NS.END_YR + 1)) {
            $('#slider').val(yr + delta).trigger('input'); // Move to next/prev year.

            if (delta < 0) {
                LF_MAP.displayed[LF_MAP.displayed.length - 1].fire('click');
            }
        }
    }
    $('.arrow').click(switchEvent);
})();


/* 
 * Creates all the markers and displays first year when page loads.
 */
(function() {
    // Image used when no street view data is present.
    var ST_VIEW_ABSENT = 'https://www.google.com/maps/embed?pb=!1m13!1m11!1m3!1d61129.78181151857!2d-77.0059245021' + 
                        '7232!3d38.89345203863472!2m2!1f0!2f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1522802214611';

    var NO_IMG_CAPTION = 'This event does not have an image yet. Contributions of any kind are welcome. If you have an ' +
                            'image to contribute, please email George Derek Musgrove at gmusgr1@umbc.edu.';

    // Filepath and extension for the icons
    var IC_PTH = 'images/icons/', 
        IC_EXT = '.png';

    // Marker image file base names
    var FST = 'fst',    BRSH = 'brsh', 
        DLLR = 'dllr',  GLB = 'glb', 
        SCHL = 'schl',  UNKN = 'unkn';

    // Change if modifying spreadsheet field names.
    var STRT = 'Start_Year',       END  = 'End_Year',
        DESC = 'Description',      NAME = 'Event_Name',
        LAT  = 'Latitude',         LONG = 'Longitude',
        STVW = 'St_View_URL',      LBL  = 'Label',
        CAPT = 'Picture_Caption',  SRC = 'Sources';

     // Gets the JSON for the data and uses it in callback.
    var requestData = function(callback, args) {
        $.getJSON(NS.DATA_URL).done(function(spreadsheet) {
            callback(spreadsheet, args);
        }).fail(function(data) {
            $('#desc_body').scrollTop(0);
            $('#image_holder div').scrollTop(0);
            $('#street_view iframe').attr('src', ST_VIEW_ABSENT);
            $('#img_link').attr('href', '');
            $('#hist_img')
                .css('height', '')
                .attr('src', '/images/icons/unkn.png');
            $('#desc_title').text('Hmmm... Something went wrong.');
            $('#desc').text('Looks like we encountered a problem getting the event data.');
            $('#src').text('');
            $('#cptn').html('');
        });
    };

    // Updates the event info on the screen. Called when icon is clicked.
    var updateInfo = function(data, args) {
        var e = data[NS.DATA_TTL][args.index];
        var eTitle = $('#desc_title');

        if (e[NAME] != eTitle.text()) {
            var cptn = e[CAPT] ? '<i>Image:</i>   ' + e[CAPT] : '';
            var imagePath = 'images/historical/' + e[NAME] + '.jpg';
            var animateTime = args.fast ? 0 : 100;

            $('#street_view iframe').attr('src', e[STVW] || ST_VIEW_ABSENT);
            $('#img_link')
                .attr('href', imagePath)
                .attr('data-title', cptn);
            $('#image_container div').fadeTo(0, 0, function() {
                $(this).find('#hist_img')
                    .css('height', '')
                    .attr('src', imagePath);
            });
            $('#desc_body').fadeOut(animateTime, function() {
                var desc = $(this);
                desc.find('#desc').text(e[DESC])
                desc.find('#src').text('Sources: ' + e[SRC])
                desc.find('#cptn').html(cptn)
                desc.fadeIn(animateTime)
                desc.scrollTop(0);
            });
            eTitle.slideUp(animateTime, function() {
                $(this)
                    .text(e[NAME])
                    .slideDown(animateTime);
            });

            $('#image_holder div').scrollTop(0);
        }
    };

    // Gets the new event and displays it.
    var switchEvent = function(event) {
        if (this != LF_MAP.selected) {
            LF_MAP.setSelected(this);
            this.remove().setIcon(this.ICONS[1]).addTo(LF_MAP);
            requestData(updateInfo, {
                index: this.EVENT_INDEX,
                fast: event.fast || null
            });
        }
    };

    // Translates an event type to the name of the icon that represents it.
    var getIconByType = function(eventType) {
        switch(eventType) {
            case 'PA/IS':
                return GLB;
            case 'BA':
                return BRSH;
            case 'IS':
                return SCHL;
            case 'BB':
                return DLLR;
            case 'P/EP':
                return FST;
            default:
                return UNKN; 
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
            return pairs[getIconByType(eventType)];
        };
    })();

    var handleNoImage = function(data) {
        var name = getIconByType(data[NS.DATA_TTL][LF_MAP.selected.EVENT_INDEX][LBL]);
        var filePath = IC_PTH + name + IC_EXT;

        $('#hist_img')
            .css('height', '96%')
            .attr('src', filePath);
        $('#img_link')
            .attr('href', filePath)
            .attr('data-title', NO_IMG_CAPTION);
    };

    // Depending on an event's time span, it can appear in multiple years.
    var getEventTimeSpan = function(startYr, endYr) {
        if (endYr == 'present') {
            return LF_MAP.ALL_MARKERS.length;
        } 
        else if (parseInt(endYr) && endYr >= startYr) {
            return endYr - startYr;
        }
        else {
            return 0;
        }
    };

    // Determines if the properties necessary to display a marker are valid for an event.
    var validateEvent = function(name, startYr, lat, long) {
        if (typeof startYr != 'number' || startYr < NS.BEGIN_YR || startYr > NS.END_YR) {
            console.log('Invalid start year in \'' + name + '.\'\n\t\'' + startYr + '\' not valid');
            return false;
        }
        else if (typeof lat != 'number' || typeof long != 'number' || !lat || !long) {
            console.log('In \'' + name + '.\'\n\t(' + lat + ', ' + long + ') is invalid.');
            return false;
        }
        return true;
    };

    // Populate ALL_MARKERS, sorts each year, then queries first year.
    var populateMarkerArray = function(data) {
        var numSuccess = i = 0;

        for (var l = data[NS.DATA_TTL].length; i < l; i++) {
            var e = data[NS.DATA_TTL][i];

            // To add a marker, it must have a start date and a position.
            if (validateEvent(e[NAME], e[STRT], e[LAT], e[LONG])) {
                var marker = L.marker([e[LAT], e[LONG]]);
                var span = getEventTimeSpan(e[STRT], e[END]);

                marker.ICONS = getIconPair(e[LBL]);
                marker.EVENT_INDEX = i; // Index to find the event in the spreadsheet.
                marker.TYPE = e[LBL]; // Caches type so that no data request is needed in eventQuery().
                marker.setIcon(marker.ICONS[0]); 
                marker.on('click', switchEvent);     
                marker.bindTooltip(e[NAME], NS.TOOLTIP_OPTIONS);
                
                // Add this to every year it falls into (start + offset).
                for (var s = e[STRT] - NS.BEGIN_YR, j = 0; j <= span && s + j < NS.NUM_YRS; j++) {
                    LF_MAP.ALL_MARKERS[s + j].push(marker);
                }

                LF_MAP.ALL_MARKERS[NS.NUM_YRS].push(marker); // All markers are put in final slot.
                numSuccess++;
            }
        }

        console.log(numSuccess + ' out of ' + i + ' events were successfully processed.');

        // Sort each year by latitude for intuitive navigation.
        (function() {
            var byLat = function(m1, m2) {
                return m1.getLatLng().lat - m2.getLatLng().lat;
            };
            for (var year of LF_MAP.ALL_MARKERS) {
                year.sort(byLat);
            }
        })();

        LF_MAP.eventQuery(NS.BEGIN_YR);
    };

    // If a historical image fails to load, load a standard image.
    window.addEventListener('error', function(err) {
        // Caption used in pop-up window when there's no historical image.
        if (err.target.id == 'hist_img') {
            requestData(handleNoImage);
        }
    }, true);

    requestData(populateMarkerArray);
})();