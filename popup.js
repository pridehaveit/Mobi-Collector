var m = chrome.extension.getBackgroundPage();

function start()
{
	var titleArray = m.titleArray;
	var table = document.getElementById("content");
	for (var i = 0; i < titleArray.length; i++)
	{
		var tr = document.createElement("tr");
		table.appendChild(tr);

		var td = document.createElement("td");
		tr.appendChild(td)
		td.innerText = titleArray[i];
		
		var tdDel = document.createElement("td");
		tr.appendChild(tdDel)
		var aDel = document.createElement("a");
		aDel.href = "javascript:deleteContent(" + i + ");"
		aDel.innerText = "delete";
		tdDel.appendChild(aDel);

		var tdUp = document.createElement("td");
		tr.appendChild(tdUp)
		if (i > 0)
		{
			var aUp = document.createElement("a");
			aUp.href = "javascript:moveContentUp(" + i + ");"
			aUp.innerText = "up";
			tdUp.appendChild(aUp);
		}

		var tdDown = document.createElement("td");
		tr.appendChild(tdDown)
		if (i < (titleArray.length - 1))
		{
			var aDown = document.createElement("a");
			aDown.href = "javascript:moveContentDown(" + i + ");"
			aDown.innerText = "down";
			tdDown.appendChild(aDown);
		}
	}
	document.getElementById("title").value = m.title;
	document.getElementById("author").value = m.author;
}

function addContent()
{
	m.addContent();
	window.setTimeout("window.location.reload(true);", 100);
}

function deleteAllContent()
{
	m.deleteAllContent();
	window.location.reload(true);
}

function deleteContent(index)
{
	m.deleteContent(index);
	window.location.reload(true);
}

function moveContentUp(index)
{
	m.moveContentUp(index);
	window.location.reload(true);
}

function moveContentDown(index)
{
	m.moveContentDown(index);
	window.location.reload(true);
}

function setTitle(t)
{
	m.title = t;
}

function setAuthor(a)
{
	m.author = a;
}

function save()
{
	m.save();
}
