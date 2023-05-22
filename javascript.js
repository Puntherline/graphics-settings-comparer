// ---------- Elements ----------
// #region
// #endregion



// ---------- Variables ----------
// #region
var current_theme = "dark";

var current_page_request;
var current_page = "main_page";
var cached_pages = {};
// #endregion



// ---------- Functions ----------
// #region
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

function generatePage(page) { // Generate and present page from json file
	// If "page" is an object, generate a page
	// If "page" is a string, it's already been generated and cached,
	// meaning I can just skip everything and set the contents' inner
	// HTML to the string.
}

function loadPageJson(page) { // Loading specified page

	// Variables
	var params_page = new URL(document.location).searchParams.get("page");
	var target_page = page || params_page;

	// Abort if no page was specified
	if (!target_page) return;

	// Abort previous request if it was running
	if (current_page_request) current_page_request.abort();

	// Check if we already have the target page cached
	if (cached_pages[target_page]) {
		generatePage(cached_pages[target_page]);
	} else {

		// Specify path to json
		current_page_request = new XMLHttpRequest();
		current_page_request.open("GET", `/graphics-settings-comparer/games/${target_page}/page.json`);

		// Handling anything that could go wrong (Do I need "error" and "abort" with "readystatechange"?)
		current_page_request.addEventListener("error", () => current_page_request = undefined);
		current_page_request.addEventListener("abort", () => current_page_request = undefined);
		current_page_request.addEventListener("readystatechange", () => {
			if (current_page_request.readyState === XMLHttpRequest.DONE) {
				const status = current_page_request.status;
				if (status === 0 || (status >= 200 && status < 400)) {
					try {
						var parsed = JSON.parse(current_page_request.responseText);
						generatePage(parsed);
					} catch {
						// Todo: Show error notification (JSON file with wrong format?)
					}
					current_page_request = undefined;
				} else {
					// Todo: Show error notification (Request failed - Maybe a list of common statuses and solutions?)
					current_page_request = undefined;
				}
			}
		});

		// Sending the request
		current_page_request.send();
	}
}
// #endregion



// ---------- Event listeners ----------
// #region
window.addEventListener("DOMContentLoaded", () => { // On page load

	// Set website theme: Local storage > Preferred via OS > Use default (dark)
	setPreferredUserTheme(true);

	// Get and load target page if specified
	loadPageJson();
});

// Temporary mockup
test_button.addEventListener("click", () => {
	loadPageJson("grand-theft-auto-v");
})
// #endregion
