// ---------- Elements ----------
// #region
var navbar_container = document.getElementById("navbar_container");
var navbar_toggle_btn = document.querySelector(".portrait_navbar_toggle");
var logos = document.getElementsByClassName("logo");
var content_element = document.getElementById("content");
// #endregion



// ---------- Variables ----------
// #region
var current_theme = "dark";

var current_page_request;
var current_page = "main_page";
var cached_pages = {
	main_page: `
		<p style="font-size: var(--text_size_0);">Text Size 0</p>
		<p style="font-size: var(--text_size_1);">Text Size 1</p>
		<p style="font-size: var(--text_size_2);">Text Size 2</p>
		<p style="font-size: var(--text_size_3);">Text Size 3</p>
		<p style="font-size: var(--text_size_4);">Text Size 4</p>
		<button id="test_button">load gtav</button>
	`
};

var navbar_visible = false;
// #endregion



// ---------- Functions ----------
// #region
function toggleNavbarVisibility() { // Toggle navbar visible or hidden
	navbar_container.style.transition = "transform .5s";
	navbar_container.classList.toggle("show_navbar_portrait");
	setTimeout(function() {
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

function generatePage(page) { // Generate and present page from json file
	var page_type = typeof(page);
	var page_code;

	// Generate code if page type is object
	if (page_type === "object") {
		page_code = "todo";
	}

	// Set contents' inner html to generated or cached code
	content_element.innerHTML = page_code || page;
}

function loadPageJson(page) { // Loading specified page

	// Variables
	var params_page = new URL(document.location).searchParams.get("page");
	var target_page = page || params_page;

	// Abort if current page is target page
	if (target_page === current_page) return;

	// No page was specified, meaning load main page
	if (!target_page) target_page = "main_page";

	// Abort previous request if it was running
	if (current_page_request) current_page_request.abort();

	// Check if we already have the target page cached
	if (cached_pages[target_page]) {
		current_page = target_page;
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
						current_page = target_page;
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

	// Glow effect around elements
	document.documentElement.addEventListener("mousemove", (e) => {
		var elems = document.querySelectorAll(".proximity_glow_effect");
		for (i = 0; i < elems.length; i++) {
			var rect = elems[i].getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;
			elems[i].style.setProperty("--x", x + "px");
			elems[i].style.setProperty("--y", y + "px");
		}
	});

	// Clicking or tapping navbar toggle button
	navbar_toggle_btn.addEventListener("click", toggleNavbarVisibility);

	// Clicking logos to go home
	for (i = 0; i < logos.length; i++) logos[i].addEventListener("click", loadPageJson("main_page"));

	// Temporary mockup
	test_button.addEventListener("click", () => {
		loadPageJson("grand-theft-auto-v");
	});
});
// #endregion
