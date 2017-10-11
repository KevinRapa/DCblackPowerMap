var myMap = L.map('map', {doubleClickZoom: false}).setView([40.741895, -73.989308], 16);
window.state = 'desktop';

var simple = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);

var resize_fun = function(e) {
	if ($(this).width() < 1200 && window.state === 'desktop') {
		window.state = 'mobile';
		var right = $("#right_box");
		$("#right_box").detach();
		$("#legend").after(right).css("margin-bottom", "5px");
		var holder = $("#mobile_holder");
		$("#mobile_holder").detach();
		$("#title_box").after(holder).text("D.C. Black History");
		$(".purple_box").each(function() {
			$(this).css("width", "650px");
		});
	}
	else if ($(this).width() >= 1200 && window.state === 'mobile') {
		window.state = 'desktop';
		$(".purple_box").each(function() {
			$(this).css("width", "1200px");
		});
		$("#legend").css("margin-bottom", "");
		$("#title_box").text("Black History in Washington D.C.");
		var holder = $("#mobile_holder");
		$("#mobile_holder").detach();
		$("#left_half").html(holder);
		var right = $("#right_box");
		$("#right_box").detach();
		$("#right_half").html(right);

	}
}

if ($(window).width() < 1200) {
	resize_fun();
}

/*
$(window).scroll(function() {
	$("#map_content").css("top", Math.max(10, 130 - $(this).scrollTop()));
});
*/
$("#to_map").on("click", function() {
	$("#intro_screen").remove();
	$("body").css("overflow", "visible");
});

$("#slider").on("input", function() {
	var curYear = document.getElementById('slider').value;
	document.getElementById('year').firstChild.nodeValue = curYear;
});

$(window).resize(resize_fun);