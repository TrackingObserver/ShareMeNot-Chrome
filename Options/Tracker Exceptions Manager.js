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

var openTrackerName;

/* Exported Functions */
exports.initialize = initialize;
exports.open = open;

function initialize() {
	var addHostnamePatternField = document.getElementById("addHostnamePatternField");
	addHostnamePatternField.addEventListener("keydown", addHostnamePattern);
	
	var removeAllExceptionsButton = document.getElementById("removeAllExceptionsButton");
	removeAllExceptionsButton.addEventListener("click", removeAllExceptions);
	
	var closeButton = document.getElementById("closeButton");
	closeButton.addEventListener("click", close);
}

function addHostnamePattern(event) {
	if (event.keyCode === 13) {
		var addHostnamePatternFieldValue = document.getElementById("addHostnamePatternField").value;
		document.getElementById("addHostnamePatternField").value = "";
		
		if (addHostnamePatternFieldValue.trim() === "")
			return;
		
		var regex = new RegExp(addHostnamePatternFieldValue);
		
		var optionsManager = require("../Options%20Manager");
		optionsManager.addException(openTrackerName, regex);
		
		populateExceptionsList();
	}
}

function populateExceptionsList() {
	var optionsManager = require("../Options%20Manager");
	var exceptions = optionsManager.getExceptions(openTrackerName);
	
	var exceptionsList = document.getElementById("exceptionsList");
	exceptionsList.innerHTML = "";
	var exceptionsFragment = document.createDocumentFragment();
	
	exceptions.forEach(function(exception) {
		var exceptionListElement = document.createElement("li");
		exceptionListElement.textContent = exception;
		exceptionsFragment.appendChild(exceptionListElement);
	});
	
	exceptionsList.appendChild(exceptionsFragment);
}

function open(trackerName) {
	openTrackerName = trackerName;
	var exceptionsManagerContainer = document.getElementById("exceptionsManagerContainer");
	exceptionsManagerContainer.setAttribute("class", "visible");
	
	// add the tracker name to the appropriate places
	var trackerNameContainers = document.querySelectorAll("#exceptionsManager .trackerName");
	for (var i = 0; i < trackerNameContainers.length; i += 1) {
		var trackerNameContainer = trackerNameContainers[i];
		trackerNameContainer.textContent = trackerName;
	}
	
	populateExceptionsList();
}

function removeAllExceptions() {
	var optionsManager = require("../Options%20Manager");
	optionsManager.removeAllExceptions(openTrackerName);
	
	populateExceptionsList();
}

function close() {
	var exceptionsManagerContainer = document.getElementById("exceptionsManagerContainer");
	exceptionsManagerContainer.setAttribute("class", "hidden");
	
	var exceptionsList = document.getElementById("exceptionsList");
	exceptionsList.innerHTML = "";
}
});
