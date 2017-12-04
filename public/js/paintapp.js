
var dataURL = "";
var id = "";
var cx; // Canvas
//********************************************************
// Helper function that builds up elements in the DOM for
// the paint app. Allows for quick construction of DOM elements
// without manually creating each element.
//********************************************************
function elt(name, attributes) {
	var node = document.createElement(name);
	if (attributes) {
		for (var attr in attributes)
			if (attributes.hasOwnProperty(attr))
				node.setAttribute(attr, attributes[attr]);
	}
	for (var i = 2; i < arguments.length; i++) {
		var child = arguments[i];
		if (typeof child == "string")
			child = document.createTextNode(child);
		node.appendChild(child);
	}
	return node;
}

//**********************************************************
// Creates the main canvas DOM element. Calls the helper
// function to create the canvas with selected parameters
//**********************************************************
var controls = Object.create(null);

function createPaint(parent) {
	var canvas = elt("canvas", {width: 900, height: 500});
	cx = canvas.getContext("2d");
	var toolbar = elt("div", {class: "toolbar"});
	for (var name in controls)
		toolbar.appendChild(controls[name](cx));
	var panel = elt("div", {class: "picturepanel"}, canvas);
	parent.appendChild(elt("div", null, panel, toolbar));
}


//***********************************************************
// Creates the dropdown that allows the user to pick a tool
// for drawing on the canvas. Uses the helper to create DOM
// elements.
//***********************************************************
var tools = Object.create(null);

controls.tool = function(cx) {
	var select = elt("select");
	for (var name in tools)
		select.appendChild(elt("option", null, name));
	cx.canvas.addEventListener("mousedown", function(event) {
		if (event.which == 1) {
			tools[select.value](event, cx);
			event.preventDefault();
		}
	});

	return elt("span", null, "Tool: ", select);
};

//**************************************************************
// Helper function to draw lines. Returns the current location of the
// mouse by calculating the relationship between the mouse location
// and the user's screen
//**************************************************************
function relativePos(event, element) {
	var rect = element.getBoundingClientRect();
	return {x: Math.floor(event.clientX - rect.left),
			y: Math.floor(event.clientY - rect.top)};
}

//***************************************************************
// Tracks the dragging of the mouse by listening for mousemove
//***************************************************************
function trackDrag(onMove, onEnd) {
	function end(event) {
		removeEventListener("mousemove", onMove);
		removeEventListener("mousemove", end);
		if (onEnd)
			onEnd(event);
	}
	addEventListener("mousemove", onMove);
	addEventListener("mouseup", end);
}
//****************************************************************
// Tool that draws lines at the current mouse location, continuing
// to draw as the mouse is moved.
//****************************************************************
tools.Line = function(event, cx, onEnd) {
	cx.lineCap = "round";

	var pos = relativePos(event, cx.canvas);
	trackDrag(function(event){
		cx.beginPath();
		cx.moveTo(pos.x, pos.y);
		pos = relativePos(event, cx.canvas);
		cx.lineTo(pos.x, pos.y);
		cx.stroke();
	}, onEnd);
};

//***************************************************************
// Tool that utilizes the line tool, however instead of creating
// pixels on the canvas, it makes those that the user mouses over
// transparent.
//***************************************************************
tools.Erase = function(event, cx) {
	cx.globalCompositeOperation = "destination-out";
	tools.Line(event, cx, function() {
		cx.globalCompositeOperation = "source-over";
	});
};

controls.color = function(cx) {
	var input = elt("input", {type: "color"});
	input.addEventListener("change", function() {
		cx.fillStroke = input.value;
		cx.strokeStyle = input.value;
	});
	return elt("span", null, "Color: ", input);
};

controls.brushSize = function(cx) {
	var select = elt("select");
	var sizes = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100];
	sizes.forEach(function(size) {
		select.appendChild(elt("option", {value: size}, size + " Pixels"));
	});
	select.addEventListener("change", function() {
		cx.lineWidth = select.value;
	});
	return elt("span", null, "Brush size: ", select);
};

//*****************************************************************
// Function that would load drawings from a data URL.
//*****************************************************************
function loadImageURL(cx, url) {
  var image = document.createElement("img");
  image.addEventListener("load", function() {
    var color = cx.fillStyle, size = cx.lineWidth;
    cx.canvas.width = image.width;
    cx.canvas.height = image.height;
    cx.drawImage(image, 0, 0);
    cx.fillStyle = color;
    cx.strokeStyle = color;
    cx.lineWidth = size;
  });
  image.src = url;
}

//*****************************************************************
// Function that saves/updates drawings in DB.
//*****************************************************************
controls.save = function(cx) {
	var link = elt("a", {onclick: "addImage()"}, "Save");
	function update() {
		try {
			dataURL = cx.canvas.toDataURL();
		} catch (e) {
			if (e instanceof SecurityError)
				link.href = "javascript:alert(" +
				JSON.stringify("Can't save: " + e.toString()) + ")";
			else
				throw e;
		}
	}
	link.addEventListener("mouseover", update);
	link.addEventListener("focus", update);
	return link;
};

//*****************************************************************
// Function that deletes drawings in DB.
//*****************************************************************
controls.delete = function(cx) {
	var link = elt("a", {onclick: "deleteMe()"}, "Delete");
	return link;
};

//********************************************************************
// Tool that allows text to be displayed on the canvas at current mouse
// location.
//********************************************************************
tools.Text = function(event, cx) {
	var text = prompt("Text:", "");
	if (text) {
		var pos = relativePos(event, cx.canvas);
		cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
		cx.fillText(text, pos.x, pos.y);
	}
};

//**************************************************************
// Creates drawing canvas in app-content-container by calling
// 'createPaint'
//**************************************************************
var drawSpace = document.getElementById('app-content-container');
createPaint(drawSpace);

//**************************************************************
// Submits a POST request to NodeJS server with a stringified
// JSON object representing a photo. dataURL is a URL that's
// parsed by the browser to construct an image.
//**************************************************************
function addImage(){
	// Initiate new POST request
	var postRequest = new XMLHttpRequest();
    var postURL = "/addImage/";
    postRequest.open('POST', postURL);

		// Create photo object
    var photoObj = {
      photoURL: dataURL,
	  	id: id
    };

		// Store object in body of request.
    var requestBody = JSON.stringify(photoObj);

    postRequest.setRequestHeader('Content-Type', 'application/json');
		postRequest.onreadystatechange = function () {
			// If the request completes successfully and a response is received
		  if(postRequest.readyState === XMLHttpRequest.DONE && postRequest.status === 200) {
				if (event.target.status !== 200) {
					alert("Error storing photo in database:\n\n\n" + postRequest.response);
				} else {
					// Get image container.
					var imageContainer = document.getElementById('image-wrapper');
					var images = imageContainer.getElementsByTagName("img");

					// Get HTML DOM node from response
					var response = document.createElement('html');
					response.innerHTML = postRequest.response;
					response = response.getElementsByTagName("img")[0];

					// Add event listeners
					response.addEventListener("mouseenter", drawEdit);
					response.addEventListener("mouseleave", drawEdit);
					response.addEventListener("click", deleteMe);
					console.log(response);
					if (id == "") {
						// If this is a new image, add it to the images list.
						imageContainer.appendChild(response);

						// Set global id variable
						id = response.getAttribute("data-id");
					} else {
						// Search for image to update
						for (var i = 0; i < images.length; i++) {
							// If found...
							if (images[i].getAttribute("data-id") == id) {
								// ... replace the HTML with the newly-rendered element.
								images[i].replaceWith(response);
							}
						}
					}
				}
		  }
		};
	postRequest.send(requestBody);
}

// Adds/removes red deletion border from images
var drawEdit = function(event) {
	var current = event.currentTarget;
	if (current.style['border'] == "2px solid rgb(0, 0, 0)") {
		current.style['border'] = "2px solid rgb(0, 256, 0)";
	} else {
		current.style['border'] = "2px solid rgb(0, 0, 0)";
	}
};

// Sends a request to delete an image
var deleteMe = function() {
	if (id != "") {
		var deleteCandidates = document.getElementsByTagName("img");
		for (var i = 0; i < deleteCandidates.length; i++) {
			if (deleteCandidates[i].getAttribute("data-id") == id) {
				deleteCandidates[i].remove();
				var postRequest = new XMLHttpRequest();
					var postURL = "/deleteImage/";
					postRequest.open('POST', postURL);

					// Create photo object
					var photoObj = {
						photoURL: dataURL,
						id: id
					};

					// Store object in body of request.
					var requestBody = JSON.stringify(photoObj);

					postRequest.setRequestHeader('Content-Type', 'application/json');
					// Send request
					postRequest.send(requestBody);
			}
		}
		loadImageURL(cx, emptyImg);
	}
};

// Loads the selected image
var loadMe = function(event) {
	id = event.currentTarget.getAttribute("data-id");
	dataURL = event.currentTarget.getAttribute("src");
	loadImageURL(cx, event.currentTarget.getAttribute("src"));
};

// Add Event Listeners for deleting/changing images
var photos = document.getElementById('image-wrapper').getElementsByTagName("img");
for (var i = 0; i < photos.length; i++) {
	photos[i].addEventListener("mouseenter", drawEdit);
	photos[i].addEventListener("mouseleave", drawEdit);
	photos[i].addEventListener("click", loadMe);
}
// Add Event Listener for new images
document.getElementById("plus").addEventListener("click", function(event) {
	id = "";
	loadImageURL(cx, emptyImg);
});


var emptyImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4QAAAH0CAYAAABl8+PTAAAgAElEQVR4Xu3XQQEAAAgCMelf2iA3GzD8sHMECBAgQIAAAQIECBAgkBRYMrXQBAgQIECAAAECBAgQIHAGoScgQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEDEI/QIAAAQIECBAgQIAAgaiAQRgtXmwCBAgQIECAAAECBAgYhH6AAAECBAgQIECAAAECUQGDMFq82AQIECBAgAABAgQIEDAI/QABAgQIECBAgAABAgSiAgZhtHixCRAgQIAAAQIECBAgYBD6AQIECBAgQIAAAQIECEQFDMJo8WITIECAAAECBAgQIEDAIPQDBAgQIECAAAECBAgQiAoYhNHixSZAgAABAgQIECBAgIBB6AcIECBAgAABAgQIECAQFTAIo8WLTYAAAQIECBAgQIAAAYPQDxAgQIAAAQIECBAgQCAqYBBGixebAEu6WxsAAAJlSURBVAECBAgQIECAAAECBqEfIECAAAECBAgQIECAQFTAIIwWLzYBAgQIECBAgAABAgQMQj9AgAABAgQIECBAgACBqIBBGC1ebAIECBAgQIAAAQIECBiEfoAAAQIECBAgQIAAAQJRAYMwWrzYBAgQIECAAAECBAgQMAj9AAECBAgQIECAAAECBKICBmG0eLEJECBAgAABAgQIECBgEPoBAgQIECBAgAABAgQIRAUMwmjxYhMgQIAAAQIECBAgQMAg9AMECBAgQIAAAQIECBCIChiE0eLFJkCAAAECBAgQIECAgEHoBwgQIECAAAECBAgQIBAVMAijxYtNgAABAgQIECBAgAABg9APECBAgAABAgQIECBAICpgEEaLF5sAAQIECBAgQIAAAQIGoR8gQIAAAQIECBAgQIBAVMAgjBYvNgECBAgQIECAAAECBAxCP0CAAAECBAgQIECAAIGogEEYLV5sAgQIECBAgAABAgQIGIR+gAABAgQIECBAgAABAlEBgzBavNgECBAgQIAAAQIECBAwCP0AAQIECBAgQIAAAQIEogIGYbR4sQkQIECAAAECBAgQIGAQ+gECBAgQIECAAAECBAhEBQzCaPFiEyBAgAABAgQIECBAwCD0AwQIECBAgAABAgQIEIgKGITR4sUmQIAAAQIECBAgQICAQegHCBAgQIAAAQIECBAgEBUwCKPFi02AAAECBAgQIECAAAGD0A8QIECAAAECBAgQIEAgKmAQRosXmwABAgQIECBAgAABAgahHyBAgAABAgQIECBAgEBUwCCMFi82AQIECBAgQIAAAQIEHieHAfXpywWiAAAAAElFTkSuQmCC";
