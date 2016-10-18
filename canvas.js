var images = {};
var sources = {
	black: 'black.png',
	black_w: 'black-w.png',
	white: 'white.png',
	white_w: 'white-w.png'
};
var canvas;
var ctx;
var background;
var turn;
var count;
var end;
var startTime;
var grid;
var wining_chips;

function loadImages(sources, callback) {
	var loadedImages = 0;
	var numImages = 0;
	// get num of sources
	for(var src in sources) {
		numImages++;
	}
	for(var src in sources) {
		images[src] = new Image();
		images[src].onload = function() {
			if(++loadedImages >= numImages) callback();
		};
		images[src].src = sources[src];
	}
}

function DrawChip(image, x, y, alpha) {
	var x1 = x * grid.caseSize + grid.casePadding;
	var y1 = y * grid.caseSize + grid.casePadding;
	ctx.globalAlpha = alpha;
	ctx.drawImage(image, x1, y1, grid.imageSize, grid.imageSize);
	ctx.globalAlpha = 1;
}

function animate(td) {
	// update
	var time = (new Date()).getTime() - startTime;

	// falling
	var newY = 0.1 * time * time / 1000 + 0.01 * time;
	if (newY > td.y) { newY = td.y; }

	// clear
	fillGrid(td);
	DrawChip(td.player, td.x, td.y, 0.5);
	DrawChip(td.player, td.x, newY, 1);

	// request new frame
	if (newY < td.y) {
		requestAnimationFrame(function() {
			animate(td);
		});
	} else {
		var pwin = wining_chips;
		var winSprite = (turn == images.white) ? images.white_w : images.black_w;
		var l = (pwin.length>=4)?4:0;
		for (var i=0 ; i<l; i++) {
			DrawChip(winSprite, pwin[i].x, pwin[i].y, 1);
		}
	}
}

function WriteMessage(message, button) {
	HideMessage(); // not perfect, but does the job
	var id = document.getElementById("message");
	id.appendChild(document.createElement("h3")).
		appendChild(document.createTextNode(message));
	if (button == null) {
		return;
	}
	var btn = document.createElement("button");
	btn.appendChild(document.createTextNode(button));
	id.appendChild(btn);
	btn.addEventListener('click', function() {
		init();
	});
}

function click(e) {
	if (end) { return; }
	var x = Math.floor(e.offsetX * grid.width / canvas.width);
	var td = fill_col(x, turn);
	if (td == null) {
		WriteMessage("Colon is full!", null);
		return;
	}
	if (count >= grid.width * grid.height) {
		end = true;
		WriteMessage("Draw!", "New Game");
		return;
	}

	var pwin = doesWin(td);
	wining_chips = pwin;
	if (pwin.length >= 4) {
		var msg = (turn == images.white) ? "White" : "Black";
		WriteMessage(msg + " won.", "New Game");
		end = true;
		return;
	}
	HideMessage();
	turn = (turn == images.white) ? images.black : images.white;
}

function mouse(e) {
	if (end) { return; }
	var x = Math.floor(e.offsetX * grid.width / canvas.width);
	fill_col(x, turn, true);
}

function HideMessage() {
	var id = document.getElementById("message");
	while (id.firstChild != null) {
		id.removeChild(id.firstChild);
	}
}

function init() {
	turn = images.white;
	count = 0;
	end = false;
	grid.length = 0;

	HideMessage();
	for (var y = 0; y < grid.height; y++) {
		for (var x = 0; x < grid.width; x++) {
			td = {};
			td.x = x;
			td.y = y;
			td.player = "";
			grid.push(td);
		}
	}

	fillGrid(null);
}

function fill_col(x, turn, preview) {
	if (end) return;
	for (var y= grid.height -1; y>=0; --y) {
		var td = grid.get(x, y);
		if (td.player == "") {
			if (preview == true) {
				fillGrid(null);
				DrawChip(turn, x, y, 0.5);
				return;
			}
			td.player = turn;
			td.x = x;
			td.y = y;
			count++;
			startTime = (new Date()).getTime();
			animate(td);
			return td;
		}
	}
	return null;
}


function compte(x, y, player, dx, dy, pwin) {
	for (var i=0; i<=4; ++i) {
		var td = grid.get(x,y);
		if (!td || td.player != player) return pwin;
		pwin.add(x,y);
		x += dx;
		y += dy;
	}
	return pwin;
}

function compteDir(x, y, player, dx, dy) {
	var pwin = [];
	pwin.add = function(x, y) {
		for (var i=0; i< this.length; i++) {
			if (this[i].x == x && this[i].y == y) { return; }
		}
		this.push({x: x, y: y});
	}
	compte(x, y, player, dx, dy, pwin) + compte(x, y, player, -dx, -dy, pwin);
	return pwin;
}

function doesWin(td) {
	// horizontal
	var pwin = compteDir(td.x, td.y, turn, 1, 0);
 	if (pwin.length >= 4) { return pwin; }
	// vertical
	pwin = compteDir(td.x, td.y, turn, 0, 1);
 	if (pwin.length >= 4) { return pwin; }
	// diag1
	pwin = compteDir(td.x, td.y, turn, 1, 1);
 	if (pwin.length >= 4) { return pwin; }
	// diag2
	pwin = compteDir(td.x, td.y, turn, 1, -1);
 	if (pwin.length >= 4) { return pwin; }
	return [];
}

function getImageBoard(canvas) {
	var cvs2 = document.createElement("canvas");
	cvs2.width = canvas.width;
	cvs2.height = canvas.height;
	var ctx = cvs2.getContext("2d");

	ctx.fillStyle = "#8B0000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "#F4A460"; // blue
	for (var x=0; x<grid.width; x++) {
		for (var y=0; y<grid.height; y++) {
			var x1 = x * grid.caseSize + grid.caseSize / 2;
			var y1 = y * grid.caseSize + grid.caseSize / 2;
			ctx.beginPath();
			ctx.arc(x1,y1, (grid.caseSize - grid.casePadding*2)/2, 0, Math.PI*2);
			ctx.fill();
		}
	}
	var image = new Image();
	image.src = cvs2.toDataURL("image/png");
	return image;
}

function fillGrid(miss) {
	ctx.drawImage(background, 0, 0);
	for (var x=0; x<grid.width; x++) {
		for (var y=0; y<grid.height; y++) {
			var td = grid.get(x,y);
			if (td == miss) { continue; }
			if ( td.player != "") {
				DrawChip(td.player, x, y, 1);
			}
		}
	}
}

loadImages(sources, function() {
	canvas = document.getElementById('myCanvas');
	ctx = canvas.getContext('2d');
	grid = [];
	grid.width = 7;
	grid.height = 6;
	canvas.height = Math.round(canvas.width * 6 / 7);
	grid.size = grid.width * grid.height;
	grid.caseSize = parseInt(canvas.width) / parseInt(grid.width); // in pixels
	grid.casePadding = 4;
	grid.imageSize = grid.caseSize - grid.casePadding*2;

	grid.get = function(x,y) {
		if (x < 0 || x >= this.width) { return null; }
		if (y < 0 || y >= this.height) { return null; }
		return this[x + y*this.width];
	}

	background = getImageBoard(canvas);
	init();
	canvas.addEventListener('click', click);
	canvas.addEventListener('mousemove', mouse);
});

// vim: set ts=2 sw=2 list:
