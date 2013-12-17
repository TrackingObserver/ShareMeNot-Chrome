define(function(require, exports, module) {
/*
ShareMeNot is licensed under the MIT license:
http://www.opensource.org/licenses/mit-license.php


Copyright (c) 2012 University of Washington

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

/*
 * Populates the options page with the settings for each tracker.
 */
function initialize() {
	initializeReplaceButtonsOption();

	var request = {
		title: "getTrackers"
	};
	chrome.extension.sendRequest(request, initializeTrackerEnabledOptions);
	
	var trackerExceptionsManager = require("./Tracker%20Exceptions%20Manager");
	trackerExceptionsManager.initialize();
}

function initializeReplaceButtonsOption() {
	var optionsManager = require("../Options%20Manager");
	var replaceButtonsCheckbox = document.getElementById("replaceButtonsCheckbox");
	replaceButtonsCheckbox.checked = optionsManager.replaceButtons();
	replaceButtonsCheckbox.addEventListener("click", function() {
		optionsManager.setReplaceButtons(replaceButtonsCheckbox.checked);
	});
}

function initializeTrackerEnabledOptions(trackers) {
	// populate the tracker enabled options
	var trackerOptionsDiv = document.getElementById("trackerOptions");
	var trackerOptionsFragment = document.createDocumentFragment();
	
	// for each tracker, add a checkbox for enabled or disabled
	trackers.forEach(function (tracker) {
		var trackerOption = createTrackerCheckboxAndLabel(tracker.name);
		trackerOptionsFragment.appendChild(trackerOption);
	});
	
	trackerOptionsDiv.appendChild(trackerOptionsFragment);
	
	var trackerOptionPrototype = document.getElementById("trackerOptionPrototype");
	trackerOptionPrototype.parentElement.removeChild(trackerOptionPrototype);
}

function createTrackerCheckboxAndLabel(trackerName) {
	var trackerOptionPrototype = document.getElementById("trackerOptionPrototype");
	
	// clone the prototype
	var trackerOption = trackerOptionPrototype.cloneNode(true);
	trackerOption.removeAttribute("id");
	
	var optionId = "tracker" + trackerName + "Enabled";
	
	var trackerEnabledCheckbox =
		trackerOption.querySelector(".enabledCheckbox");
	var trackerNameContainer =
		trackerOption.querySelector(".trackerName");
	
	trackerNameContainer.textContent = trackerName;
	
	// check the box for the tracker if it has been checked previously
	var optionsManager = require("../Options%20Manager");
	trackerEnabledCheckbox.checked = optionsManager.isBlocked(trackerName);
	trackerEnabledCheckbox.setAttribute("id", optionId);
	trackerEnabledCheckbox.addEventListener("click", function() {
		optionsManager.setBlocked(trackerName, trackerEnabledCheckbox.checked);
	});
	
	var trackerExceptionsButton = trackerOption.querySelector(".exceptionsButton");
	trackerExceptionsButton.addEventListener("click", function() {
		var trackerExceptionsManager = require("./Tracker%20Exceptions%20Manager");
		trackerExceptionsManager.open(trackerName);
	});
	
	return trackerOption;
}

initialize();
});
