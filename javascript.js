// ---------- Elements ----------
// #region
// #endregion



// ---------- Variables ----------
// #region
var current_theme = "medium";
var valid_pages = [
	"main_page"
];
// #endregion



// ---------- Functions ----------
// #region
function setPreferredUserTheme(startup) { // Setting the preferred user theme
	var new_theme;
	var valid_themes = ["light", "medium", "dark"];

	// Just loaded the page
	if (startup) {

		// Attempt loading from local storage
		try {
			new_theme = JSON.parse(localStorage.getItem("graphics-settings-comparer")).theme;
			if (!valid_themes.includes(new_theme)) throw new Error();
		} catch {}

		// If no result yet, attempt loading from matchMedia color scheme preferences
		if (!new_theme) {
			try {
				new_theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "medium";
			} catch {}
		}

		// If still not set yet, use medium as a default
		if (!new_theme) new_theme = "medium";

	// Button to switch to next theme clicked - Use next theme
	} else {
		var next_theme = valid_themes.indexOf(current_theme);
		if (next_theme !== -1) {
			next_theme++;
			if (next_theme > 2) next_theme = 0;
		}
		new_theme = valid_themes[next_theme];
	}

	// Theme changed - Update and save
	if (new_theme !== current_theme) {
		localStorage.setItem("graphics-settings-comparer", JSON.stringify({theme: new_theme}));
		document.documentElement.dataset.theme = new_theme;
		current_theme = new_theme;
	}
}

function loadPage(page) { // Loading specified page

	// Variables
	var params_page = new URL(document.location).searchParams.get("page");
	var target_page = page || params_page || "main_page";

	// Todo: Using XMLHttpRequest for the individual jsonc files.

	// Example:
	// const request = new XMLHttpRequest();
	// request.open("GET", `/graphics-settings-comparer/${target_page}.jsonc`);
	// request.send();

	// Also:
	// - Needs handlers for aborting
	// - Needs handlers for failed fetching
	// - Needs handlers for manually aborting if another page was requested instead
	// - Needs a check if the page exists, if not then present 404 page
}
// #endregion


// ---------- Event listeners ----------
// #region
window.addEventListener("DOMContentLoaded", () => { // On page load

	// Set website theme: Local storage > Preferred via OS > Use default (Medium)
	setPreferredUserTheme(true);

	// Get and load target page or default if unspecified
	loadPage();

	// Once all is done, present page
	document.getElementById("fullscreen_container").removeAttribute("style");
	document.body.removeAttribute("style");
});
// #endregion