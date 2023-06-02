// ---------- Elements ----------
// #region
var navbar_container = document.getElementById("navbar_container");
var navbar_toggle_btn = document.querySelector(".portrait_navbar_toggle");
var logos = document.getElementsByClassName("logo");
var navbar_buttons = document.querySelectorAll(".navbar_item_container");
var game_searchbox = document.getElementById("game_searchbox");
var navbar_glow_effects = document.querySelectorAll("div.navbar_item_container.proximity_glow_effect");
var games_glow_effects = document.querySelectorAll("div#games_list_container > div.proximity_glow_effect");
// #endregion



// ---------- Variables ----------
// #region
var current_theme = "dark";
var current_page_request;
var current_page;
var cached_games = {};
var visibility_toggle_timeout;
var screen_dimensions;
// #endregion



// ---------- Functions ----------
// #region
function toggleNavbarVisibility(show) { // Toggle navbar visible or hidden
	navbar_container.style.transition = "transform .5s";
	if (show === true) {
		navbar_container.classList.add("show_navbar_portrait");
	} else if (show === false) {
		navbar_container.classList.remove("show_navbar_portrait");
	} else {
		navbar_container.classList.toggle("show_navbar_portrait");
	}
	clearTimeout(visibility_toggle_timeout);
	visibility_toggle_timeout = setTimeout(function() {
		navbar_container.removeAttribute("style");
	}, 600);
}

function setPreferredUserTheme(startup) { // Setting the preferred user theme
	var new_theme;

	// Page just loaded, try getting preferred theme
	if (startup) {

		// Try loading via local storage first, also clear storage if neither light nor dark
		try {
			var local_storage_theme = JSON.parse(localStorage.getItem("graphics-settings-comparer")).theme;
			if (local_storage_theme !== "light" && local_storage_theme !== "dark") {
				localStorage.removeItem("graphics-settings-comparer");
			} else {
				new_theme = local_storage_theme;
			}
		} catch {}

		// If not defined yet, try via match media
		if (!new_theme) {
			try {
				var os_theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
				new_theme = os_theme;
			} catch {}
		}

		// Still not defined yet, maybe compatibility issue, set to dark
		if (!new_theme) new_theme = "dark";

	// Change was requested manually
	} else {
		new_theme = new_theme.includes("dark") ? "light" : "dark";
	}

	// Theme changed - Update and save (save if not default)
	if (new_theme !== current_theme) {
		if (new_theme === "dark") {
			localStorage.removeItem("graphics-settings-comparer");
		} else {
			localStorage.setItem("graphics-settings-comparer", JSON.stringify({theme: new_theme}));
		}
		document.documentElement.dataset.theme = new_theme;
		current_theme = new_theme;
	}
}

function generatePage(page, hash) { // Generate and present page from json file, scroll to hash if present

	// Variables
	var code;

	// Temporary placeholder
	code = `
		<p>
			Game ID: ${page.id}<br>
			Label: ${page.label}<br>
			Description: ${page.description}
		</p>
	`;

	// Set contents' inner html to generated code and save in cache variable
	current_page.innerHTML = code;
	cached_games[page.id] = code;

	// Todo: Scroll to wherever `hash` is if it exists
}

function loadGameJson(game, hash) { // Loading from cache or json file

	// Abort previous request if it was running
	if (current_page_request) current_page_request.abort();

	// Check if we already have the target page cached
	if (cached_games[game]) {

		// Hide previous page if required
		if (current_page) {
			if (current_page.id !== "page_custom") {
				current_page.classList.add("page_hidden");
				current_page = document.getElementById("page_custom");
				current_page.classList.remove("page_hidden");
			}
		} else {
			current_page = document.getElementById("page_custom");
			current_page.classList.remove("page_hidden");
		}

		// Set custom pages' inner HTML to cached data
		document.getElementById("page_custom").innerHTML = cached_games[game];

		// Update URL (Cached, meaning clicked manually, so we skip the hash)
		var new_url = `${window.location.pathname}?page=${game}`;
		history.pushState(null, "", new_url);
	} else {

		// Specify path to json
		current_page_request = new XMLHttpRequest();
		current_page_request.open("GET", `/graphics-settings-comparer/games/${game}/page.json`);

		// Handling anything that could go wrong (Do I need "error" and "abort" with "readystatechange"?)
		current_page_request.addEventListener("error", () => current_page_request = undefined);
		current_page_request.addEventListener("abort", () => current_page_request = undefined);
		current_page_request.addEventListener("readystatechange", () => {
			if (current_page_request.readyState === XMLHttpRequest.DONE) {
				const status = current_page_request.status;
				if (status === 0 || (status >= 200 && status < 400)) {

					// Attempt parsing requested json
					try {
						var parsed = JSON.parse(current_page_request.responseText);

						// Update URL if required
						var new_url = `${window.location.pathname}?page=${game}${hash || ""}`;
						var current_url = `${window.location.pathname}${window.location.search}${window.location.hash}`;
						if (new_url !== current_url) history.pushState(null, "", new_url);

						// Hide previous page if required
						if (current_page) {
							if (current_page.id !== "page_custom") {
								current_page.classList.add("page_hidden");
								current_page = document.getElementById("page_custom");
								current_page.classList.remove("page_hidden");
							}
						} else {
							current_page = document.getElementById("page_custom");
							current_page.classList.remove("page_hidden");
						}

						// Generate HTML code with parsed json results
						generatePage(parsed, hash);
					} catch {

						// Hide previous page if required
						if (current_page) {
							if (current_page.id !== "page_error") {
								current_page.classList.add("page_hidden");
								current_page = document.getElementById("page_error");
								current_page.classList.remove("page_hidden");
							}
						} else {
							current_page = document.getElementById("page_error");
							current_page.classList.remove("page_hidden");
						}

						// Add error text to error page
						current_page.innerText = `Something went wrong - Error when attempting to parse the fetched JSON file.`;
					}

					current_page_request = undefined;
				} else {

					// Hide previous page if required
					if (current_page) {
						if (current_page.id !== "page_error") {
							current_page.classList.add("page_hidden");
							current_page = document.getElementById("page_error");
							current_page.classList.remove("page_hidden");
						}
					} else {
						current_page = document.getElementById("page_error");
						current_page.classList.remove("page_hidden");
					}

					// Add error text to error page
					current_page.innerText = `Something went wrong - Error code: ${status}`;

					current_page_request = undefined;
				}
			}
		});

		// Sending the request
		current_page_request.send();
	}
}

function setupContent() { // Called only on startup, checking search params and hash

	// Variables
	var url_search = new URLSearchParams(window.location.search).get("page");
	var url_search_element = document.querySelector(`div#page_${url_search}`);
	var url_hash = (window.location.hash === "") ? undefined : window.location.hash;

	// No search specified, use main page
	if (!url_search) url_search_element = document.getElementById("page_main");

	// Via search params specified page is an element: Show it
	if (url_search_element) {
		url_search_element.classList.remove("page_hidden");
		current_page = url_search_element;

	// No element found but page was specified, fetch json file
	} else if (url_search) {
		loadGameJson(url_search, url_hash);
	}
}

function switchPages(event) { // Switching pages

	// Variables
	var target_page_id = event.currentTarget.getAttribute("target_page");
	var target_page = document.getElementById(target_page_id);

	// Item in navbar was clicked, hide navbar if visible in portrait
	if (
		(
			event.currentTarget.classList.contains("navbar_item_container") ||
			event.currentTarget.classList.contains("navbar_top")
		) && (
			document.getElementById("navbar_container").classList.contains("show_navbar_portrait")
		)
	) {
		toggleNavbarVisibility(false);
	}

	// Hide current page if required
	if (current_page.id !== target_page_id) {
		current_page.classList.add("page_hidden");
		current_page = target_page;
		current_page.classList.remove("page_hidden");
	}

	// Update search params and remove hash
	var search_params = (target_page_id === "page_main") ? "" : `?page=${target_page_id.slice(5)}`;
	var new_url = `${window.location.pathname}${search_params}`;
	history.pushState(null, "", new_url);
}

function searchGamesList(event) { // Searching the games list for what the user entered
	console.log(event.currentTarget.value);
}

// var ran = false;
function updateGlowEffect(event) { // Updating the glow effect of all specified elements

	// There's a clever way to go about this, I'm sure of it.
	// I just haven't found it yet.

/*
	// Todo:
	// - Make some of these variables globally scoped
	// - Update on browser resize
	var viewport_width = window.screen.width;
	var viewport_height = window.screen.height;
	var glow_radius = 0.15;
	var glow_radius_x = viewport_width * glow_radius;
	var glow_radius_y = viewport_height * glow_radius;

	// Iterate all navbar buttons
	for (i = 0; i < navbar_glow_effects.length; i++) {

		// Get top/bottom/left/right of element
		var element_rect = navbar_glow_effects[i].getBoundingClientRect();

		// If element is not out of bounds
		if (
			element_rect.top < viewport_height &&
			element_rect.bottom > 0 &&
			element_rect.left < viewport_width &&
			element_rect.right > 0
		) {

			// If glow effect is within radius
			if (
				event.clientX > element_rect.left - glow_radius_x &&
				event.clientX < element_rect.right + glow_radius_x &&
				event.clientY > element_rect.top - glow_radius_y &&
				event.clientY < element_rect.bottom - glow_radius_y
			) {

				// Calculate x and y
				var new_x = event.clientX - element_rect.left;
				var new_y = event.clientY - element_rect.top;

				// Set property
				navbar_glow_effects[i].style.setProperty("--x", new_x + "px");
				navbar_glow_effects[i].style.setProperty("--y", new_y + "px");
			}
		} else {
			console.log(navbar_glow_effects[i]);
		}
	}

	// if (ran) return;

	// Iterate all elements
	// for (i = 0; i < glow_effect_elements.length; i++) {

		// Todo:
		// - If top and bottom are out of vertical viewport, skip
		// - If left and right are out of horizontal viewport, skip
		// - Don't automatically get all glow effect elements:
			// - Get navbar elements and game elements separately
			// - If current page is not games page, don't even iterate games
			// - Do the same for other pages too
	// }
	// ran = true;

	// for (i = 0; i < glow_effect_elements.length; i++) {
	// 	var rect = glow_effect_elements[i].getBoundingClientRect();
	// 	var x = event.clientX - rect.left;
	// 	var y = event.clientY - rect.top;
	// 	glow_effect_elements[i].style.setProperty("--x", x + "px");
	// 	glow_effect_elements[i].style.setProperty("--y", y + "px");
	// }

	// Get the elements' bounding rectangle (top, bottom, left, right)
	// var rect = glow_effect_elements[0].getBoundingClientRect();

	// Check if the new x and y are both within range

	// Get new X and Y for element
	// var new_x = event.clientX - rect.left;
	// var new_y = event.clientY - rect.top;

	// TEMP
	// console.log(`Rect x(${rect.left}) y(${rect.top})\nCursor x(${event.clientX}) y(${event.clientY})`);
*/
}
// #endregion



// ---------- Event listeners ----------
// #region
window.addEventListener("DOMContentLoaded", () => { // On page load

	// Set website theme: Local storage > Preferred via OS > Use default (dark)
	setPreferredUserTheme(true);

	// Showing requested content
	setupContent();

	// Glow effect on mouse move around specified elements
	// glow_effect_elements = document.getElementsByClassName("proximity_glow_effect");
	// screen_dimensions = {x: window.screen.width, y: window.screen.height};
	// document.documentElement.addEventListener("mousemove", updateGlowEffect);

	// Glow effect on mouse move around specified elements
	/*document.documentElement.addEventListener("mousemove", (e) => {
		var elems = document.querySelectorAll(".proximity_glow_effect");
		for (i = 0; i < elems.length; i++) {
			var rect = elems[i].getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;
			elems[i].style.setProperty("--x", x + "px");
			elems[i].style.setProperty("--y", y + "px");
		}
	});*/

	// Clicking or tapping navbar toggle button
	navbar_toggle_btn.addEventListener("click", toggleNavbarVisibility);

	// Clicking or tapping logos to go home
	for (i = 0; i < logos.length; i++) logos[i].addEventListener("click", switchPages);

	// Navbar buttons
	for (i = 0; i < navbar_buttons.length; i++) navbar_buttons[i].addEventListener("click", switchPages);

	// Set the feeds' content
	document.getElementById("feed_container").innerHTML = document.getElementById("page_feed").innerHTML;

	// Typing into the searchbox for the games
	game_searchbox.addEventListener("input", searchGamesList);
});
// #endregion
