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

/**
 * Contains Chrome-specific code for the popup page.
 */

document.addEventListener("DOMContentLoaded", initialize);

var browserAbstractionLayer = (function() {
	var exports = {};
	
	/**
	 * Blocks the tracker with the specified name on the active tab (i.e.,
	 * the one that contains this popup window).
	 * 
	 * @param {String} trackerName the name of the tracker to block
	 */
	exports.blockTrackerOnActiveTab = function(trackerName) {
		chrome.tabs.getSelected(null, function(tab) {
			var request = {
				title: "blockTrackerOnTab",
				tabId: tab.id,
				"trackerName": trackerName
			};

			chrome.extension.sendRequest(request);
		});
	}
	
	/**
	 * Closes the popup window.
	 */
	exports.closePopup = function() {
		window.close();
	}
	
	/**
	 * Gets the tracker blocking data from the main extension. Calls the
	 * provided callback function with the tracker blocking data.
	 * 
	 * @param {Function} callback the callback function that processes the
	 *                   tracker blocking data
	 */
	exports.getTrackerData = function(callback) {
		chrome.tabs.getSelected(null, function(tab) {
			var request = {
				title: "getDataForPopup",
				tabId: tab.id
			};
			chrome.extension.sendRequest(request, function(response) {
				if (response !== null) {
					var blockedTrackerCount = response.blockedTrackerCount;
					var blockTracker = response.blockTracker;
					callback(blockTracker, blockedTrackerCount);
				} else { // no tracker data for the active tab
					callback(null, null);
				}
			});
		});
	}
	
	/**
	 * Reloads the tab that contains this popup window.
	 */
	exports.reloadActiveTab = function() {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.reload(tab.id);
		});
	}
	
	/**
	 * Resizes the popup window to fit its contents.
	 */
	exports.resizeToFit = function() {
		// not needed for Chrome
	}
	
	exports.openOptions = function() {
		var optionsPageUrl = chrome.extension.getURL("Options/Options.html");
		window.open(optionsPageUrl);
	}
	
	/**
	 * Unblocks all trackers on the active tab (i.e., the one that contains
	 * this popup window).
	 */
	exports.unblockAllTrackersOnActiveTab = function() {
		chrome.tabs.getSelected(null, function(tab) {
			var request = {
				title: "unblockAllTrackersOnTab",
				tabId: tab.id
			};
			
			chrome.extension.sendRequest(request);
		});
	}
	
	/**
	 * Unblocks the tracker with the specified name on the active tab (i.e.,
	 * the one that contains this popup window).
	 * 
	 * @param {String} trackerName the name of the tracker to unblock
	 */
	exports.unblockTrackerOnActiveTab = function(trackerName) {		
		chrome.tabs.getSelected(null, function(tab) {
			var request = {
				title: "unblockTrackerOnTab",
				tabId: tab.id,
				"trackerName": trackerName
			};

			chrome.extension.sendRequest(request);
		});
	}
	
	return exports;
}());