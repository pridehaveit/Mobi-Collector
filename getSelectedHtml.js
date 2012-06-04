var range = window.getSelection().getRangeAt(0);
var content = range.cloneContents();
var span = document.createElement('SPAN');
span.appendChild(content);

// image src to actual height and width map
srcToSize = new Object();
for (var i = 0; i < document.images.length; i++)
{
	var image = document.images[i];
	srcToSize[image.src] = {height: image.height, width: image.width};
}

var imgTags = span.getElementsByTagName("img");
for (var i = 0; i < imgTags.length; i++)
{
	// use height and width from image object
	imgTags[i].height = srcToSize[imgTags[i].src].height;
	imgTags[i].width = srcToSize[imgTags[i].src].width;
	// convert all src attributes to absolute uris
	imgTags[i].src = imgTags[i].src
}

chrome.extension.sendRequest(span.innerHTML);
