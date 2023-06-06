// ---------- Elements ----------
// #region
var navbar_container = document.getElementById("navbar_container");
var navbar_toggle_btn = document.querySelector(".portrait_navbar_toggle");
var logos = document.getElementsByClassName("logo");
var navbar_buttons = document.querySelectorAll(".navbar_item_container");
var game_searchbox = document.getElementById("game_searchbox");
var navbar_glow_effects = document.querySelectorAll("div.navbar_item_container.proximity_glow_effect");
var games_glow_effects;
var games_list_container = document.getElementById("games_list_container");
// #endregion



// ---------- Variables ----------
// #region
// Editable
var glow_update_fps = 30;
var glow_update_ms = 1000 / glow_update_fps;
var glow_radius = window.screen.width * 0.3; // Requires change in .proximity_glow_effect CSS
var games_list = { // Just example games for now
	["cities-skylines"]: "Cities Skylines",
	["crysis"]: "Crysis",
	["crysis-2"]: "Crysis 2",
	["crysis-3"]: "Crysis 3",
	["cyberpunk-2077"]: "Cyberpunk 2077",
	["fallout-4"]: "Fallout 4",
	["forza-horizon-5"]: "Forza Horizon 5",
	["frostpunk"]: "Frostpunk",
	["grand-theft-auto-v"]: "Grand Theft Auto V",
	["just-cause-3"]: "Just Cause 3",
	["kerbal-space-program"]: "Kerbal Space Program",
	["kingdom-come-deliverance"]: "Kingdom Come: Deliverance",
	["mad-max"]: "Mad Max",
	["microsoft-flight-simulator-2020"]: "Microsoft Flight Simulator 2020",
	["satisfactory"]: "Satisfactory",
	["watch-dogs-2"]: "Watch_Dogs 2",
	["wreckfest"]: "Wreckfest"
};

// Non-editable
var current_theme = "dark";
var current_page_request;
var current_page;
var cached_games = {};
var visibility_toggle_timeout;
var screen_dimensions;
var last_mouse_move = Date.now();
var glow_applied_navbtns = [];
var glow_applied_gamebtns = [];
var games_list_processed = "";
var games_list_set = false;
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

function setGamesListContent() { // Generating and setting games list content
	if (games_list_set) return;

	if (games_list_processed === "") {
		for (const [k, v] of Object.entries(games_list)) {
			games_list_processed = `
				${games_list_processed}
				<div target_page="page_${k}" class="proximity_glow_effect game_button_container">
					<div class="games_list_item">
						<img class="games_list_icon" src="/graphics-settings-comparer/games/${k}/icon.png">
						<p class="games_list_item_text">${v}</p>
					</div>
				</div>
			`;
		}
	}
	games_list_container.innerHTML = games_list_processed;
	games_list_set = true;
	games_glow_effects = document.querySelectorAll("div#games_list_container > div.proximity_glow_effect");

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
		if (url_search_element.id === "page_games") setGamesListContent();
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

	// Switch pages (if required)
	if (current_page.id !== target_page_id) {

		// Switched to games list: Set inner HTML for it
		if (target_page_id === "page_games") setGamesListContent();

		// Set old page hidden and new page visible
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

	// Get search argument
	var search = event.currentTarget.value.toLowerCase();

	// Search empty - Show all game buttons
	if (search === "") {
		var hidden_games = document.querySelectorAll("div#games_list_container > div.game_hidden");
		for (i = 0; i < hidden_games.length; i++) hidden_games[i].classList.remove("game_hidden");
	}

	// Iterate games list
	for (const [game_id, game_label] of Object.entries(games_list)) {
		var game_button = document.querySelector(`div[target_page="page_${game_id}"]`);
		if (game_label.toLowerCase().indexOf(search) === -1) {
			if (!game_button.classList.contains("game_hidden")) game_button.classList.add("game_hidden");
		} else {
			if (game_button.classList.contains("game_hidden")) game_button.classList.remove("game_hidden");
		}
	}
}

function updateGlowEffect(event) { // Checking if the glow effect needs updating

	// Don't update if last update isn't long enough ago
	var current_mouse_move = Date.now();
	if (current_mouse_move - last_mouse_move < glow_update_ms) return;

	// Get mouse position
	var mouse_x = event.clientX;
	var mouse_y = event.clientY;

	// Navbar (if visible)
	var nav_rect = navbar_container.getBoundingClientRect();
	if (nav_rect.right > 0) {

		// Iterate all navbar buttons
		for (i = 0; i < navbar_buttons.length; i++) {
			var rect = navbar_buttons[i].getBoundingClientRect();

			// If cursor is in range of current button
			if (
				mouse_x > rect.left - glow_radius && // Not too far left
				mouse_x < rect.right + glow_radius && // Not too far right
				mouse_y > rect.top - glow_radius && // Not too far up
				mouse_y < rect.bottom + glow_radius // Not too far down
			) {
				var x = mouse_x - rect.left;
				var y = mouse_y - rect.top;
				navbar_buttons[i].style.setProperty("--x", x + "px");
				navbar_buttons[i].style.setProperty("--y", y + "px");
				if (!glow_applied_navbtns.includes(i)) glow_applied_navbtns.push(i);

			// Cursor isn't in range, clean up if required
			} else {
				var index = glow_applied_navbtns.indexOf(i);
				if (index !== -1) {
					navbar_buttons[i].style.removeProperty("--x");
					navbar_buttons[i].style.removeProperty("--y");
					glow_applied_navbtns.splice(index, 1);
				}
			}
		}
	}

	// Games list
	if (current_page.id === "page_games") {

		// Iterate all game buttons
		for (i = 0; i < games_glow_effects.length; i++) {
			var rect = games_glow_effects[i].getBoundingClientRect();

			// If cursor is in range of current button
			if (
				mouse_x > rect.left - glow_radius && // Not too far left
				mouse_x < rect.right + glow_radius && // Not too far right
				mouse_y > rect.top - glow_radius && // Not too far up
				mouse_y < rect.bottom + glow_radius // Not too far down
			) {
				var x = mouse_x - rect.left;
				var y = mouse_y - rect.top;
				games_glow_effects[i].style.setProperty("--x", x + "px");
				games_glow_effects[i].style.setProperty("--y", y + "px");
				if (!glow_applied_gamebtns.includes(i)) glow_applied_gamebtns.push(i);

			// Cursor isn't in range, clean up if required
			} else {
				var index = glow_applied_gamebtns.indexOf(i);
				if (index !== -1) {
					games_glow_effects[i].style.removeProperty("--x");
					games_glow_effects[i].style.removeProperty("--y");
					glow_applied_gamebtns.splice(index, 1);
				}
			}
		}
	}

	// Update last mouse move time
	last_mouse_move = current_mouse_move;
}
// #endregion



// ---------- Event listeners ----------
// #region
window.addEventListener("DOMContentLoaded", () => { // On page load

	// Set website theme: Local storage > Preferred via OS > Use default (dark)
	setPreferredUserTheme(true);

	// Showing requested content
	setupContent();

	// Glow effect on mouse move
	window.addEventListener("mousemove", updateGlowEffect);

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
