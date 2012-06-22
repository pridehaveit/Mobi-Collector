function Mobi(content, images, metadata)
{
	var m = this;
	
	m.content = m.encodeUtf8(content);
	m.images = images;
	m.metadata = metadata;
	
	if (!m.metadata.title)
		m.metadata.title = "Unknown";
	if (!m.metadata.author)
		m.metadata.author = "Unknown";
	if (!m.metadata.type)
		m.metadata.type = 2; // Mobipocket Book
	if (!m.metadata.lang)
		m.metadata.lang = 9 // English
	if (!m.metadata.sublang)
		m.metadata.sublang = 0 // None
	
	//m.compression = 1; // no compression
	m.compression = 2; // PalmDOC compression
}

Mobi.prototype.cpalmdoc_memcmp = function(data, a, b, len)
{
	for (var i = 0; i < len; i++)
		if (data[a+i] != data[b+i])
			return false;
	return true;
}

Mobi.prototype.cpalmdoc_rfind = function(data, pos, chunk_length)
{
	var m = this;
	
	for (var i = pos - chunk_length; i >= 0; i--) 
	{
		if (m.cpalmdoc_memcmp(data, i, pos, chunk_length))
			return i;
	}
	return pos;
}

Mobi.prototype.compress = function(b)
{
	var m = this;
	
	var output = [];
	var i = 0;
	while (i < b.length)
	{
		var c = b[i];
		// do repeats
		if (i > 10 && (b.length - i) > 10)
		{
			var found = false;
			for (var chunk_len = 10; chunk_len > 2; chunk_len--) {
				var j = m.cpalmdoc_rfind(b, i, chunk_len);
				var dist = i - j;
				if (j < i && dist < 2048) {
					found = true;
					var compound = (dist << 3) + chunk_len - 3;
					output.push(0x80 + (compound >> 8));
					output.push(compound & 0xFF);
					i += chunk_len;
					break;
				}
			}
			if (found) continue;
		}

		//write single character
		i++;
		if (c == 32 && i < b.length)
		{
			var n = b[i];
			if (n >= 0x40 && n <= 0x7F)
			{
				output.push(n ^ 0x80);
				i++;
				continue;
			}
		}
		if (c == 0 || (c > 8 && c < 0x80))
		{
			output.push(c);
		}
		// Write binary data
		else
		{
			var j = i;
			var temp = [];
			temp.push(c);
			while (j < b.length && temp.length < 8)
			{
				c = b[j];
				if (c == 0 || (c > 8 && c < 0x80))
					break;
				temp.push(c);
				j++;
			}
			i += temp.length - 1;
			output.push(temp.length);
			for (j = 0; j < temp.length; j++)
			{
				output.push(temp[j]);
			}
		}
	}
	return output;
}

Mobi.prototype.create = function()
{
	var m = this;
	
	m.records = new Array();
	m.nRecords = 1;
	m.firstContentRecord = 1;
	m.nTextRecords = 0;

	var pos = 0;
	var compressedLength = 0;
	var contentWithZero = m.content + "\0";
	while (pos < contentWithZero.length)
	{
		var length = Math.min(4096, contentWithZero.length - pos);
		var block = m.stringToArray(contentWithZero.substr(pos, 4096));
		if (m.compression == 2) // PalmDOC compression
		{
			block = m.compress(block);
		}
		compressedLength += block.length;
		m.records[m.nRecords] = block;
		m.nRecords++;
		m.nTextRecords++;
		pos += 4096;
	}

	m.lastContentRecord = m.nRecords;

	var padding = ((Math.floor((compressedLength - 1) / 4) + 1) * 4) - compressedLength;
	if (padding > 0)
	{
		var paddingArray = new Uint8Array(padding);
		for (var i = 0; i < padding; i++)
		{
			paddingArray[i] = 0;
		}
		m.records[m.nRecords] = paddingArray;
		m.nRecords++;
	}

	m.firstImageRecord = m.nRecords;
	
	for (var i = 0; i < m.images.length; i++)
	{
		m.records[m.nRecords] = m.stringToArray(m.images[i]);
		m.nRecords++;
	}

	m.flisRecord = m.nRecords;
	m.records[m.nRecords] = m.createFlis();
	m.nRecords++;
	
	m.fcisRecord = m.nRecords;
	m.records[m.nRecords] = m.createFcis(m.content.length);
	m.nRecords++;
	
	m.records[m.nRecords] = m.createEof();
	m.nRecords++;

	m.records[0] = m.createRecord0();

	return m.createPalmDoc();
}

Mobi.prototype.createPalmDoc = function()
{
	var m = this;
	
	var length = 78 + (8 * m.nRecords) + 2;
	for (var i = 0; i < m.nRecords; i++) {
		length += m.records[i].length;
	}
	var array = new Uint8Array(length);
	// name	database name. This name is 0 terminated in the field and will be used as the file name on a computer.
	// For eBooks this usually contains the title and may have the author depending on the length available.
	m.setStringInArray(m.metadata.title.substr(0, 32), array, 0);
	for (var i = m.metadata.title.length; i < 32; i++) {
		array[i] = 0x00;
	}
	var now = new Date().getTime() / 1000;
	// attributes
	Struct.PackTo(">H", array, 32, [0]);
	// version	file version
	Struct.PackTo(">H", array, 34, [0]);
	// creation date	No. of seconds since start of January 1, 1970.
	Struct.PackTo(">I", array, 36, [now]);
	// modification date	 No. of seconds since start of January 1, 1970.
	Struct.PackTo(">I", array, 40, [now]);
	// last backup date	No. of seconds since start of January 1, 1970.
	Struct.PackTo(">I", array, 44, [0]);
	// modificationNumber
	Struct.PackTo(">I", array, 48, [0]);
	// appInfoID	offset to start of Application Info (if present) or null
	Struct.PackTo(">I", array, 52, [0]);
	// sortInfoID	offset to start of Sort Info (if present) or null
	Struct.PackTo(">I", array, 56, [0]);
	// type	See above table. (For Applications this data will be 'appl')
	m.setStringInArray("BOOK", array, 60);
	// creator	See above table. This program will be launched if the file is tapped
	m.setStringInArray("MOBI", array, 64);
	// uniqueIDseed	used internally to identify record
	Struct.PackTo(">I", array, 68, [(2 * m.nRecords) - 1]);
	// nextRecordListID	Only used when in-memory on Palm OS. Always set to zero in stored files.
	Struct.PackTo(">I", array, 72, [0]);
	// number of Records	number of records in the file - N
	Struct.PackTo(">H", array, 76, [m.nRecords]);
	// record Info List	
	var offset = 78 + (8 * m.nRecords) + 2;
	for (var i = 0; i < m.nRecords; i++) {
		// record Data Offset	 the offset of record n from the start of the PDB of this record
		Struct.PackTo(">I", array, 78 + (8 * i), [offset]);
		// 1. byte: record Attributes
		// 2. - 4. byte: UniqueID	The unique ID for this record. Often just a sequential count from 0
		Struct.PackTo(">I", array, 82 + (8 * i), [i]);
		// Records	The actual data in the file. AppInfoArea (if present), SortInfoArea (if present) and then records sequentially
		array.set(m.records[i], offset);
		offset += m.records[i].length;
	}
	// Gap to data	traditionally 2 zero bytes to Info or raw data
	Struct.PackTo(">H", array, 78 + (8 * m.nRecords), [0]);
	return array;
}

Mobi.prototype.createRecord0 = function()
{
	var m = this;
	
	var exth = m.createExth();
	
	var afterExth = 248 + exth.length;
	var afterExthPadding = (Math.floor((afterExth - 1) / 4) + 1) * 4;
	var afterTitle = afterExthPadding + m.metadata.title.length;
	var afterTitlePadding = (Math.floor((afterTitle /* + (8 * 1024) */ - 1) / 4) + 1) * 4;

	var array = new Uint8Array(afterTitlePadding);
	// Compression	 1 == no compression, 2 = PalmDOC compression, 17480 = HUFF/CDIC compression
	Struct.PackTo(">H", array, 0, [m.compression]);
	// Unused	Always zero
	Struct.PackTo(">H", array, 2, [0]);
	// text length	Uncompressed length of the entire text of the book
	Struct.PackTo(">I", array, 4, [m.content.length]);
	// record count	Number of PDB records used for the text of the book.
	Struct.PackTo(">H", array, 8, [m.nTextRecords]);
	// record size	Maximum size of each record containing text, always 4096
	Struct.PackTo(">H", array, 10, [4096]);
	// Encryption Type	 0 == no encryption, 1 = Old Mobipocket Encryption, 2 = Mobipocket Encryption
	Struct.PackTo(">H", array, 12, [0]);
	// Unknown	Usually zero
	Struct.PackTo(">H", array, 14, [0]);
	// identifier	the characters M O B I
	m.setStringInArray("MOBI", array, 16);
	// header length	 the length of the MOBI header, including the previous 4 bytes
	Struct.PackTo(">I", array, 20, [232]);
	// Mobi type  2 Mobipocket Book
	Struct.PackTo(">I", array, 24, [m.metadata.type]);
	// text Encoding	1252 = CP1252 (WinLatin1); 65001 = UTF-8
	Struct.PackTo(">I", array, 28, [65001]);
	// Unique-ID	Some kind of unique ID number (random?)
	Struct.PackTo(">I", array, 32, [m.random(0xffffffff)]);
	// File version	Version of the Mobipocket format used in this file.
	Struct.PackTo(">I", array, 36, [6]);
	// Ortographic index	Section number of orthographic meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 40, [0xffffffff]);
	// Inflection index	Section number of inflection meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 44, [0xffffffff]);
	// Index names	0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 48, [0xffffffff]);
	// Index keys	0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 52, [0xffffffff]);
	// Extra index 0	Section number of extra 0 meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 56, [0xffffffff]);
	// Extra index 1	Section number of extra 1 meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 60, [0xffffffff]);
	// Extra index 2	Section number of extra 2 meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 64, [0xffffffff]);
	// Extra index 3	Section number of extra 3 meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 68, [0xffffffff]);
	// Extra index 4	Section number of extra 4 meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 72, [0xffffffff]);
	// Extra index 5	Section number of extra 5 meta index. 0xFFFFFFFF if index is not available.
	Struct.PackTo(">I", array, 76, [0xffffffff]);
	// First Non-book index?	First record number (starting with 0) that's not the book's text
	Struct.PackTo(">I", array, 80, [m.firstImageRecord]);
	// Full Name Offset	Offset in record 0 (not from start of file) of the full name of the book
	Struct.PackTo(">I", array, 84, [afterExthPadding]);
	// Full Name Length	Length in bytes of the full name of the book
	Struct.PackTo(">I", array, 88, [m.metadata.title.length]);
	// Locale	Book locale code. Low byte is main language 09= English, next byte is dialect, 08 = British, 04 = US. Thus US English is 1033, UK English is 2057.
	Struct.PackTo(">HBB", array, 92, [0, m.metadata.sublang, m.metadata.lang]);
	// Input Language	Input language for a dictionary
	Struct.PackTo(">I", array, 96, [0]);
	// Output Language	Output language for a dictionary
	Struct.PackTo(">I", array, 100, [0]);
	// Min version	Minimum mobipocket version support needed to read this file.
	Struct.PackTo(">I", array, 104, [6]);
	// First Image index	First record number (starting with 0) that contains an image. Image records should be sequential.
	Struct.PackTo(">I", array, 108, [m.firstImageRecord]);
	// Huffman Record Offset	 The record number of the first huffman compression record.
	Struct.PackTo(">I", array, 112, [0]);
	// Huffman Record Count	 The number of huffman compression records.
	Struct.PackTo(">I", array, 116, [0]);
	// Huffman Table Offset
	Struct.PackTo(">I", array, 120, [0]);
	// Huffman Table Length
	Struct.PackTo(">I", array, 124, [0]);
	// EXTH flags	bitfield. if bit 6 (0x40) is set, then there's an EXTH record
	Struct.PackTo(">I", array, 128, [0x50]);
	// ?	32 unknown bytes, if MOBI is long enough
	Struct.PackTo(">IIIIIIII", array, 132, [0, 0, 0, 0, 0, 0, 0, 0]);
	// DRM Offset	Offset to DRM key info in DRMed files. 0xFFFFFFFF if no DRM
	Struct.PackTo(">I", array, 164, [0xffffffff]);
	// DRM Count	Number of entries in DRM info. 0xFFFFFFFF if no DRM
	Struct.PackTo(">I", array, 168, [0xffffffff]);
	// DRM Size	Number of bytes in DRM info.
	Struct.PackTo(">I", array, 172, [0]);
	// DRM Flags	Some flags concerning the DRM info.
	Struct.PackTo(">I", array, 176, [0]);
	// Unknown 	Bytes to the end of the MOBI header, including the following if the header length >= 228 (244 from start of record).
	Struct.PackTo(">III", array, 180, [0, 0, 0]);
	// First content record number 	Number of first text record. Normally 1.
	Struct.PackTo(">H", array, 192, [m.firstContentRecord]);
	// Last content record number 	Number of last image record or number of last text record if it contains no images.
	Struct.PackTo(">H", array, 194, [m.lastContentRecord]);
	// Unknown 	Use 0x00000001.
	Struct.PackTo(">I", array, 196, [1]);
	// FCIS record number 	
	Struct.PackTo(">I", array, 200, [m.fcisRecord]);
	// Unknown (FCIS record count?) 	Use 0x00000001.
	Struct.PackTo(">I", array, 204, [1]);
	// FLIS record number 	
	Struct.PackTo(">I", array, 208, [m.flisRecord]);
	// Unknown (FLIS record count?) 	Use 0x00000001.
	Struct.PackTo(">I", array, 212, [1]);
	// Unknown 	Use 0x0000000000000000.
	Struct.PackTo(">II", array, 216, [0, 0]);
	// Unknown 	Use 0xFFFFFFFF.
	Struct.PackTo(">I", array, 224, [0xffffffff]);
	// Unknown 	Use 0x00000000.
	Struct.PackTo(">I", array, 228, [0]);
	// Unknown 	Use 0xFFFFFFFF.
	Struct.PackTo(">I", array, 232, [0xffffffff]);
	// Unknown 	Use 0xFFFFFFFF.
	Struct.PackTo(">I", array, 236, [0xffffffff]);
	// Extra Record Data Flags 	A set of binary flags, some of which indicate extra data at the end of each text block.
	// This only seems to be valid for Mobipocket format version 5 and 6 (and higher?), when the header length is 228 (0xE4) or 232 (0xE8).
	// bit 1 (0x1): <extra multibyte bytes><size>
	// bit 2 (0x2): <TBS indexing description of this HTML record><size>
	// bit 3 (0x4): <uncrossable breaks><size> 
	// Setting bit 2 (0x2) disables <guide><reference type="start"> functionality. 	
	Struct.PackTo(">I", array, 240, [1]);
	// INDX Record Offset	(If not 0xFFFFFFFF)The record number of the first INDX record created from an ncx file.
	Struct.PackTo(">I", array, 244, [0xffffffff]);
	// EXTH
	array.set(exth, 248);
	// Padding	Null bytes to pad the EXTH header to a multiple of four bytes (none if the header is already a multiple of four)
	for (var i = afterExth; i < afterExthPadding; i++)
	{
		array[i] = 0;
	}
	m.setStringInArray(m.metadata.title, array, afterExthPadding);
	for (var i = afterTitle; i < afterTitlePadding; i++)
	{
		array[i] = 0;
	}
	return array;
}

Mobi.prototype.createExth = function()
{
	var m = this;

	var records = new Array();
	var i = 0;
	// author (100)
	records[i++] = {"type": 100, "data": m.stringToArray(m.metadata.author)};
	// updatedtitle (503)
	records[i++] = {"type": 503, "data": m.stringToArray(m.metadata.title)};
	// cdetype (501)
	records[i++] = {"type": 501, "data": m.stringToArray("EBOK")};
	// Creator Software (204) = kindlegen Linux (201)
	records[i++] = {"type": 204, "data": Struct.Pack(">I", [201])};
	// Creator Major Version (205) = 1
	records[i++] = {"type": 205, "data": Struct.Pack(">I", [1])};
	// Creator Minor Version (206) = 2
	records[i++] = {"type": 206, "data": Struct.Pack(">I", [2])};
	// Creator Build Number (207) = 33307
	records[i++] = {"type": 207, "data": Struct.Pack(">I", [33307])};
	
	return m.createExthFromRecords(records);
}

Mobi.prototype.createExthFromRecords = function(records)
{
	var m = this;

	var length = 12;
	for (var i = 0; i < records.length; i++)
	{
		length += 8 + records[i].data.length;
	}
	var array = new Uint8Array(length);
	// identifier	the characters E X T H
	m.setStringInArray("EXTH", array, 0);
	// header length	 the length of the EXTH header, including the previous 4 bytes
	Struct.PackTo(">I", array, 4, [length]);
	// record Count	The number of records in the EXTH header. the rest of the EXTH header consists of repeated EXTH records to the end of the EXTH length.
	Struct.PackTo(">I", array, 8, [records.length]);
	// EXTH records
	var pos = 12
	for (var i = 0; i < records.length; i++)
	{
		pos = m.writeExthRecord(array, pos, records[i]);
	}
	return array;
}

Mobi.prototype.writeExthRecord = function(array, pos, record)
{
	// record type	Exth Record type. Just a number identifying what's stored in the record
	Struct.PackTo(">I", array, pos, [record.type]);
	// record length	length of EXTH record = L , including the 8 bytes in the type and length fields
	Struct.PackTo(">I", array, pos + 4, [record.data.length + 8]);
	// record data	Data.
	array.set(record.data, pos + 8);
	return pos + record.data.length + 8;
}

Mobi.prototype.createFlis = function()
{
	var m = this;

	var array = new Uint8Array(36);
	// identifier 	the characters F L I S (0x46 0x4c 0x49 0x53)
	m.setStringInArray("FLIS", array, 0);
	// fixed value: 8
	Struct.PackTo(">I", array, 4, [8]);
	// fixed value: 65
	Struct.PackTo(">H", array, 8, [65]);
	// fixed value: 0
	Struct.PackTo(">H", array, 10, [0]);
	// fixed value: 0
	Struct.PackTo(">I", array, 12, [0]);
	// fixed value: -1 (0xFFFFFFFF)
	Struct.PackTo(">I", array, 16, [0xffffffff]);
	// fixed value: 1
	Struct.PackTo(">H", array, 20, [1]);
	// fixed value: 3
	Struct.PackTo(">H", array, 22, [3]);
	// fixed value: 3
	Struct.PackTo(">I", array, 24, [3]);
	// fixed value: 1
	Struct.PackTo(">I", array, 28, [1]);
	// fixed value: -1 (0xFFFFFFFF) 
	Struct.PackTo(">I", array, 32, [0xffffffff]);
	return array;
}

Mobi.prototype.createFcis = function()
{
	var m = this;

	var array = new Uint8Array(44);
	// identifier 	the characters F C I S (0x46 0x43 0x49 0x53)
	m.setStringInArray("FCIS", array, 0);
	// fixed value: 20
	Struct.PackTo(">I", array, 4, [20]);
	// fixed value: 16
	Struct.PackTo(">I", array, 8, [16]);
	// fixed value: 1
	Struct.PackTo(">I", array, 12, [1]);
	// fixed value: 0
	Struct.PackTo(">I", array, 16, [0]);
	// text length (the same value as "text length" in the PalmDoc header)
	Struct.PackTo(">I", array, 20, [m.content.length]);
	// fixed value: 0
	Struct.PackTo(">I", array, 24, [0]);
	// fixed value: 32
	Struct.PackTo(">I", array, 28, [32]);
	// fixed value: 8
	Struct.PackTo(">I", array, 32, [8]);
	// fixed value: 1
	Struct.PackTo(">H", array, 36, [1]);
	// fixed value: 1
	Struct.PackTo(">H", array, 38, [1]);
	// fixed value: 0 	
	Struct.PackTo(">I", array, 40, [0]);
	return array;
}

Mobi.prototype.createEof = function()
{
	var array = new Uint8Array(4);
	// fixed value: 233 (0xe9)
	array[0] = 0xe9;
	// fixed value: 142 (0x8e)
	array[1] = 0x8e;
	// fixed value: 13 (0x0d)
	array[2] = 0x0d;
	// fixed value: 10 (0x0a) 
	array[3] = 0x0a;
	return array;
}

Mobi.prototype.setStringInArray = function(str, arr, off)
{
	for (var i = 0; i < str.length; i++) {
		arr[off+i] = str.charCodeAt(i) & 0xff;
	}
}

Mobi.prototype.stringToArray = function(str)
{
	var m = this;

	var arr = new Uint8Array(str.length);
	m.setStringInArray(str, arr, 0);
	return arr;
}

Mobi.prototype.random = function(end)
{
	return Math.floor(Math.random() * (end + 1));
}

Mobi.prototype.encodeUtf8 = function(s)
{
	return unescape(encodeURIComponent(s));
}
