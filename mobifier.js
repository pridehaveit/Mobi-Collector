function Mobifier(sourceHtml)
{
	this.sourceHtml = sourceHtml;
	this.headingNo = 7;
	this.title = "Unknown";
	this.inTT = false;
	this.inP = false;
}

Mobifier.prototype.convert = function()
{
	var sourceTree = document.createElement("SPAN");
	sourceTree.innerHTML = this.sourceHtml;
	
	var targetTree = document.createElement("SPAN");
	this.convertChilds(sourceTree, targetTree);
	return targetTree.innerHTML;
}

Mobifier.prototype.convertChilds = function(sourceNode, targetParent)
{
	for (var i = 0; i < sourceNode.childNodes.length; i++)
	{
		this.convertElement(sourceNode.childNodes[i], targetParent);
	}
}
	
Mobifier.prototype.convertElement = function(sourceNode, targetParent)
{
  //console.log(sourceNode.nodeType);
	if (sourceNode.nodeType == 3) // text
		this.text(sourceNode, targetParent);
	else if (sourceNode.nodeType == 1) // element
		if (this[sourceNode.nodeName])
			this[sourceNode.nodeName](sourceNode, targetParent);
		else
		  console.log("unknown element " + sourceNode.nodeName);
}

Mobifier.prototype.saveTitle = function(title, headingNo)
{
	if (headingNo < this.headingNo)
	{
		this.headingNo = headingNo;
		this.title = title;
	}
}

Mobifier.prototype.unmodified = function(sourceNode, targetParent)
{
	var targetNode = document.createElement(sourceNode.nodeName);
	targetParent.appendChild(targetNode);
	this.convertChilds(sourceNode, targetNode);
}

Mobifier.prototype.text = function(sourceNode, targetParent)
{
	var text = sourceNode.data;
	if (this.inTT)
	{
		text = text.replace(/ /g, "\u00a0");
		var lines = text.split(/\r?\n/);
		for (var i = 0; i < lines.length; i++)
		{
			targetParent.appendChild(document.createTextNode(lines[i]));
			if (i < (lines.length - 1))
				targetParent.appendChild(document.createElement("BR"));
		}
	}
	else
	{
		text = text.replace(/[\t ]+/, " ");
		targetParent.appendChild(document.createTextNode(text));
	}
}

Mobifier.prototype.A = function(sourceNode, targetParent)
{
	this.convertChilds(sourceNode, targetParent);
}

Mobifier.prototype.ABBR = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.ACRONYM = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.ADDRESS = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.APPLET = function(sourceNode, targetParent)
{
}

Mobifier.prototype.AREA = function(sourceNode, targetParent)
{
}

Mobifier.prototype.B = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.BASEFONT = function(sourceNode, targetParent)
{
}

Mobifier.prototype.BDO = function(sourceNode, targetParent)
{
}

Mobifier.prototype.BIG = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.BLOCKQUOTE = function(sourceNode, targetParent)
{
	// change contained paragraphs to blockquotes
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.BR = function(sourceNode, targetParent)
{
	targetParent.appendChild(document.createElement(sourceNode.nodeName));
}

Mobifier.prototype.BUTTON = function(sourceNode, targetParent)
{
}

Mobifier.prototype.CAPTION = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.CENTER = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.CITE = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.CODE = function(sourceNode, targetParent)
{
	this.TT(sourceNode, targetParent);
}

Mobifier.prototype.COL = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.COLGROUP = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.DD = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.DEL = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.DFN = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.DIR = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.DIV = function(sourceNode, targetParent)
{
	this.convertChilds(sourceNode, targetParent);
}

Mobifier.prototype.DL = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.DT = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.EM = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.FIELDSET = function(sourceNode, targetParent)
{
}

Mobifier.prototype.FONT = function(sourceNode, targetParent)
{
}

Mobifier.prototype.FORM = function(sourceNode, targetParent)
{
}

Mobifier.prototype.FRAME = function(sourceNode, targetParent)
{
}

Mobifier.prototype.FRAMESET = function(sourceNode, targetParent)
{
}

Mobifier.prototype.H1 = function(sourceNode, targetParent)
{
	this.saveTitle(sourceNode.innerText, 1);
	this.P(sourceNode, targetParent);
}

Mobifier.prototype.H2 = function(sourceNode, targetParent)
{
	this.saveTitle(sourceNode.innerText, 2);
	this.P(sourceNode, targetParent);
}

Mobifier.prototype.H3 = function(sourceNode, targetParent)
{
	this.saveTitle(sourceNode.innerText, 3);
	this.P(sourceNode, targetParent);
}

Mobifier.prototype.H4 = function(sourceNode, targetParent)
{
	this.saveTitle(sourceNode.innerText, 4);
	this.P(sourceNode, targetParent);
}

Mobifier.prototype.H5 = function(sourceNode, targetParent)
{
	this.saveTitle(sourceNode.innerText, 5);
	this.P(sourceNode, targetParent);
}

Mobifier.prototype.H6 = function(sourceNode, targetParent)
{
	this.saveTitle(sourceNode.innerText, 6);
	this.P(sourceNode, targetParent);
}

Mobifier.prototype.HR = function(sourceNode, targetParent)
{
	targetParent.appendChild(document.createElement(sourceNode.nodeName));
}

Mobifier.prototype.I = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.IFRAME = function(sourceNode, targetParent)
{
}

Mobifier.prototype.IMG = function(sourceNode, targetParent)
{
	var targetNode = document.createElement(sourceNode.nodeName);

	if (sourceNode.align)
		targetNode.align = sourceNode.align;
	else
		targetNode.align = "left";
		
	targetNode.src = sourceNode.src;
	//targetNode.height = sourceNode.height;
	//targetNode.width = sourceNode.width;
		
	targetParent.appendChild(targetNode);
}

Mobifier.prototype.INS = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.ISINDEX = function(sourceNode, targetParent)
{
}

Mobifier.prototype.KDB = function(sourceNode, targetParent)
{
	this.TT(sourceNode, targetParent);
}

Mobifier.prototype.LABEL = function(sourceNode, targetParent)
{
}

Mobifier.prototype.LEGEND = function(sourceNode, targetParent)
{
}

Mobifier.prototype.LI = function(sourceNode, targetParent)
{
	this.inP = true;
	this.unmodified(sourceNode, targetParent);
	this.inP = false;
}

Mobifier.prototype.MAP = function(sourceNode, targetParent)
{
}

Mobifier.prototype.MENU = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.NOFRAMES = function(sourceNode, targetParent)
{
}

Mobifier.prototype.NOSCRIPT = function(sourceNode, targetParent)
{
}

Mobifier.prototype.OBJECT = function(sourceNode, targetParent)
{
}

Mobifier.prototype.OL = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.OPTGROUP = function(sourceNode, targetParent)
{
}

Mobifier.prototype.OPTION = function(sourceNode, targetParent)
{
}

Mobifier.prototype.P = function(sourceNode, targetParent)
{
	var targetNode = document.createElement(sourceNode.nodeName);

	if (sourceNode.align)
		targetNode.align = sourceNode.align;
	else
		targetNode.align = "left";
		
	targetNode.setAttribute("width", "0");
	targetNode.setAttribute("height", "1em");
		
	targetParent.appendChild(targetNode);
	this.inP = true;
	this.convertChilds(sourceNode, targetNode);
	this.inP = false;
}

Mobifier.prototype.PARAM = function(sourceNode, targetParent)
{
}

Mobifier.prototype.PRE = function(sourceNode, targetParent)
{
	this.TT(sourceNode, targetParent);
}

Mobifier.prototype.Q = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.S = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.SAMP = function(sourceNode, targetParent)
{
	this.TT(sourceNode, targetParent);
}

Mobifier.prototype.SCRIPT = function(sourceNode, targetParent)
{
}

Mobifier.prototype.SELECT = function(sourceNode, targetParent)
{
}

Mobifier.prototype.SMALL = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.SPAN = function(sourceNode, targetParent)
{
	this.convertChilds(sourceNode, targetParent);
}

Mobifier.prototype.STRIKE = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.STRONG = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.SUB = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.SUP = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TABLE = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TBODY = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TD = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TEXTAREA = function(sourceNode, targetParent)
{
}

Mobifier.prototype.TFOOT = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TH = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.THEAD = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TR = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.TT = function(sourceNode, targetParent)
{
	var pNode;
  if (this.inP)
	{
		pNode = targetParent;
	}
	else
	{
		pNode = document.createElement("P");
		pNode.setAttribute("width", "0");
		pNode.setAttribute("height", "1em");
		targetParent.appendChild(pNode);
	}

	var targetNode = document.createElement("TT");
	pNode.appendChild(targetNode);
	this.inTT = true;
	this.convertChilds(sourceNode, targetNode);
	this.inTT = false;
}

Mobifier.prototype.U = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.UL = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}

Mobifier.prototype.VAR = function(sourceNode, targetParent)
{
	this.unmodified(sourceNode, targetParent);
}
