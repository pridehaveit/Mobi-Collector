function padLeft(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

function getImageData(img)
{
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/jpeg");

    return window.atob(dataURL.replace(/^data:image\/(png|jpeg);base64,/, ""));
}

function extractAndIndexImages(tree)
{
	var imageArray = new Array();
	var imgTags = tree.getElementsByTagName("img");
	var nextIndex = 0;
	var uriToIndex = new Object();
	for (var i = 0; i < imgTags.length; i++)
	{
		if (imgTags[i].height == 0 || imgTags[i].width == 0)
		{
			imgTags[i].parentNode.removeChild(imgTags[i]);
			i--;
			continue;
		}
		var index;
		if (uriToIndex[imgTags[i].src])
		{
			index = uriToIndex[imgTags[i].src];
		}
		else
		{
			index = nextIndex++;
			uriToIndex[imgTags[i].src] = index;
			imageArray[index] = getImageData(imgTags[i]);
		}
		imgTags[i].height = imgTags[i].height;
		imgTags[i].width = imgTags[i].width;
		imgTags[i].removeAttribute("src");
		imgTags[i].setAttribute("recindex", padLeft((index + 1), 5));
	}
	return imageArray;
}

function addContentCallback(request, sender, sendResponse)
{
	mobifier = new Mobifier(request);
	var html = mobifier.convert();
	htmlArray.push(html);
	titleArray.push(mobifier.title);
}

var span;
var interval;

function waitForImagesLoaded()
{
	var imgTags = span.getElementsByTagName("img");
	for (var i = 0; i < imgTags.length; i++)
	{
		if (!imgTags[i].complete || imgTags[i].height == 0 || imgTags[i].width == 0)
		{
			return;
		}
	}
	window.clearInterval(interval);
	continueSave();
}

function save()
{
	span = document.createElement('SPAN');
	span.innerHTML = htmlArray.join("<mbp:pagebreak></mbp:pagebreak>");
	//console.log(span.innerHTML);

	interval = window.setInterval("waitForImagesLoaded();", 10);
}

function continueSave()
{
	var imageArray = extractAndIndexImages(span);

	var content = '<html><head></head><body>' + span.innerHTML + '</body></html>';
	
	var mobi = new Mobi(content, imageArray, {"title": title, "author": author});

	var bb = new window.WebKitBlobBuilder();
	bb.append(mobi.create().buffer);
	var blob = bb.getBlob('application/x-mobipocket-ebook ');
	var url = window.webkitURL.createObjectURL(blob);
	chrome.tabs.create({"url": url})
}

function addContent() {
	chrome.tabs.executeScript(null, {"file": "getSelectedHtml.js"});
}

function deleteAllContent()
{
	htmlArray.splice(0, htmlArray.length);
	titleArray.splice(0, titleArray.length);
}

function deleteContent(index)
{
	htmlArray.splice(index, 1);
	titleArray.splice(index, 1);
}

function moveContentUp(index)
{
	if (index < 1 || index > htmlArray.length)
		return;
	var html = htmlArray[index];
	var title = titleArray[index];
	htmlArray[index] = htmlArray[index - 1];
	titleArray[index] = titleArray[index - 1];
	htmlArray[index - 1] = html;
	titleArray[index - 1] = title;
}

function moveContentDown(index)
{
	if (index < 0 || index > (htmlArray.length - 1))
		return;
	var html = htmlArray[index];
	var title = titleArray[index];
	htmlArray[index] = htmlArray[index + 1];
	titleArray[index] = titleArray[index + 1];
	htmlArray[index + 1] = html;
	titleArray[index + 1] = title;
}

chrome.contextMenus.create({"title": "Add selected content", "contexts": ["selection"], "onclick": addContent});
chrome.contextMenus.create({"title": "Save Mobi", "contexts": ["selection"], "onclick": save});
//chrome.browserAction.onClicked.addListener(addContent);
chrome.extension.onRequest.addListener(addContentCallback);

var htmlArray = new Array();
var titleArray = new Array();

var title = "";
var author = "";
