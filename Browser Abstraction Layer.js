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

/* Contains Chrome-specific code. */

/* Global Variables */
var blockTrackerOnTab;
var getDataForPopup;
var tabCount;
var tabInfoUpdaterCallback;
var unblockAllTrackersOnTab;
var unblockTrackerOnTab;
var urlPatternsToTrackersMap;
var getDataForContentScriptCallback;
var trackers;

//var trackerBlockedIconTabVisibility;
//var trackerBlockedIcon;

/* Exported Functions */
exports.initialize = initialize;
exports.addContentScriptInserter = addContentScriptInserter;
exports.addWebRequestFilter = addWebRequestFilter;
exports.addWebRequestHeaderFilter = addWebRequestHeaderFilter;
exports.getFileContents = getFileContents;
exports.getFullUrl = getFullUrl;
exports.setGetDataForPopupFunction = setGetDataForPopupFunction;
exports.setTabBlockingFunctions = setTabBlockingFunctions;
exports.setTabInfoUpdaterCallback = setTabInfoUpdaterCallback;
exports.showTrackerBlockedIcon = showTrackerBlockedIcon;
//exports.hideTrackerBlockedIcon = hideTrackerBlockedIcon;

/**
 * Initializes the browser abstraction layer for the main extension.
 * 
 * @param {Array} trackers an array of Tracker objects representing the
 *                         trackers blocked by this extension
 */
function initialize(trackers2) {
	trackers = trackers2;
	
	// initialize options if necessary
	var optionsManager = require("./Options%20Manager");
	optionsManager.initialize(trackers);
	
	chrome.extension.onRequest.addListener(requestResponder);
}

function requestResponder(request, sender, sendResponse) {
	var requestTitle = request.title;
	
	switch (requestTitle) {
		/* Requests from content script */
		case "contentScriptReady":
			var contentScriptData = getDataForContentScriptCallback(sender.tab.id);
			sendResponse(contentScriptData);
		break;
		
		case "unblockTracker":
			var trackerName = request.trackerName;
			unblockTrackerOnTab(sender.tab.id, trackerName);
			sendResponse();
		break;
		
		/* Requests from popup */
		case "getDataForPopup":
			var tabId = request.tabId;
			var data = getDataForPopup(tabId);
			sendResponse(data);
		break;
		
		case "blockTrackerOnTab":
			var tabId = request.tabId;
			var trackerName = request.trackerName;
			blockTrackerOnTab(tabId, trackerName);
			sendResponse();
		break;
		
		case "unblockAllTrackersOnTab":
			var tabId = request.tabId;
			unblockAllTrackersOnTab(tabId);
			sendResponse();
		break;
		
		case "unblockTrackerOnTab":
			var tabId = request.tabId;
			var trackerName = request.trackerName;
			unblockTrackerOnTab(tabId, trackerName);
			sendResponse();
		break;
		
		/* Requests from options page */
		case "getTrackers":
			sendResponse(trackers);
		break;
		
		default:
			throw "Invalid request sent to contentScriptResponder";
	}
}

/**
 * Makes the content script be injected to every page that loads.
 * 
 * @param {Array} contentScriptPaths an array of paths of content scripts to
 *                                   be injected into every page that loads
 * @param {Function} getDataForContentScriptCallback the function that should
 *                                                   be called to get the data
 *                                                   for the content script
 */
function addContentScriptInserter(contentScriptPaths, getDataForContentScriptCallback2) {
	// content script paths are already defined in the manifest.json file in
	// Chrome
	
	getDataForContentScriptCallback = getDataForContentScriptCallback2;
}

/**
 * Adds the web request filter. Blocks requests or allows them.
 * 
 * @param {Function} callback the function that should be called to determine
 *                            whether a request should be blocked or not
 */
function addWebRequestFilter(callback) {
	// each web request is blocked from continuing until the callback function
	// has finished
	var extraInfoSpec = ["blocking"];
	
	trackers.forEach(function (tracker) {		
		// only listen for HTTP requests for subframes or scripts contained within
		// a main page with the URL patterns defined for the current tracker
		var requestFilter = {
	        	types: ["sub_frame", "script", "image"],
	        	urls: tracker.matchPatterns
	    };
		
		chrome.webRequest.onBeforeRequest.addListener(
				function(webRequestDetails) {
					var requestTabId = webRequestDetails.tabId;
					var requestUrl = webRequestDetails.url;
					return {cancel: callback(requestTabId, requestUrl, tracker)};
				},
				requestFilter, extraInfoSpec);
	});
}

/**
 * Adds the web request filter for headers. Either removes cookies from the request or leaves them.
 * 
 * @param {Function} callback the function that should be called to determine
 *                            whether cookies should be removed or not.
 */
function addWebRequestHeaderFilter(callback) {
	// each web request is blocked from continuing until the callback function
	// has finished
	var extraInfoSpec = ["blocking", "requestHeaders"];

	trackers.forEach(function (tracker) {
			// only listen for HTTP requests for subframes or scripts contained within
			// a main page with the URL patterns defined for the current tracker
			var requestFilter = {
				types: ["sub_frame", "script", "image"],
				urls: tracker.matchPatterns
			};

			chrome.webRequest.onBeforeSendHeaders.addListener(
				function(webRequestDetails) {
					var requestTabId = webRequestDetails.tabId;
					var requestUrl = webRequestDetails.url;

					if (callback(requestTabId, requestUrl, tracker)) {
						// Remove the cookie header
						for (var i = 0; i < webRequestDetails.requestHeaders.length; ++i) {
							if (webRequestDetails.requestHeaders[i].name === 'Cookie') {
								webRequestDetails.requestHeaders.splice(i, 1);
								break;
							}
						}
					}

					return {requestHeaders: webRequestDetails.requestHeaders};
				},
				requestFilter, extraInfoSpec);
	});
}

/**
 * Creates the tracker blocked icon.
 */
function createTrackerBlockedIcon() {
	// icon specified in the manifest.json file in Chrome
	// since the popup directly calls functions in the background page, there
	// is no need to make listeners for popup events
}

/**
 * Returns the contents of the file at filePath.
 * 
 * @param {String} filePath the path to the file
 * 
 * @return {String} the contents of the file
 */
function getFileContents(filePath) {
	var url = chrome.extension.getURL(filePath);
	
	var request = new XMLHttpRequest();
	request.open("GET", url, false);
	request.send();
	
	return request.responseText;
}

/**
 * Returns the full absolute URL of a file based on its partial path within the
 * extension.
 * 
 * @param {String} partialUrl the partial path of the file
 * 
 * @return {String} the full absolute URL of the file
 */
function getFullUrl(partialUrl) {
	return chrome.extension.getURL(partialUrl);
}

/**
 * Sets the function that gets the data for the popup window.
 * 
 * @param {Function} getDataForPopup2 the function that gets the data for the
 *                                    popup window
 */
function setGetDataForPopupFunction(getDataForPopup2) {
	getDataForPopup = getDataForPopup2;
}

/**
 * Sets the functions that manage tracker blocking and unblocking on tabs.
 * 
 * @param {Function} blockTrackerOnTab2 the function that blocks a tracker on a
 *                                      specific tab
 * @param {Function} unblockTrackerOnTab2 the function that unblocks a tracker
 *                                      on a specific tab
 * @param {Function} unblockAllTrackersOnTab2 the function that unblocks all
 *                                      trackers on a specific tab
 */
function setTabBlockingFunctions(blockTrackerOnTab2, unblockTrackerOnTab2,
		unblockAllTrackersOnTab2) {
	blockTrackerOnTab = blockTrackerOnTab2;
	unblockTrackerOnTab = unblockTrackerOnTab2;
	unblockAllTrackersOnTab = unblockAllTrackersOnTab2;
}

/**
 * Sets the function that updates the internal tabInfo array mapping tabs to
 * data about them.
 * 
 * @param {Function} callback the function that updates the internal tabInfo
 *                            array mapping tabs to data about them
 */
function setTabInfoUpdaterCallback(callback) {
	// only listen for HTTP requests coming from a tab's main frame
	var requestFilter = {
	                    	types: ["main_frame"],
	                    	urls: ["http://*/*", "https://*/*"]
	};
	
	// TODO: check to see if this is absolutely necessary; possibly can remove
	//       to improve performance, but could introduce a race condition if
	//       removed
	var extraInfoSpec = ["blocking"]; // each web request is blocked from
	                                  // continuing until the callback function
	                                  // has finished
	
	chrome.webRequest.onBeforeRequest.addListener(
		function(webRequestDetails) {
			var requestTabId = webRequestDetails.tabId;
			var requestUrl = webRequestDetails.url;
			
			callback(requestTabId, requestUrl);
		},
		requestFilter, extraInfoSpec);
}

/**
 * Shows the tracker blocked icon on the tab with the given ID.
 * 
 * @param {Number} the ID of the tab on which to show the tracker blocked icon
 */
function showTrackerBlockedIcon(tabId) {
	chrome.pageAction.show(tabId);
}
});
