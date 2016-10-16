var images = {};
var sources = {
	black: 'black.png',
	white: 'white.png'
};
var canvas = document.getElementById('myCanvas');
canvas.addEventListener('click', click);
var ctx = canvas.getContext('2d');
var background;
var turn;
var count;
var end;
var startTime;

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

function animate(td) {
	// update
	var time = (new Date()).getTime() - startTime;

	var linearSpeed = 0.2;
	
	// falling
	var newY = linearSpeed * time * time / 1000 + 0.01 * time;
	if (newY > td.y) { newY = td.y; }

	// clear
	fillGrid(td);
	var x1 = td.x * grid.caseSize + grid.casePadding;
	var y1 = newY * grid.caseSize + grid.casePadding;
	ctx.drawImage(td.player, x1, y1, grid.imageSize, grid.imageSize);

	// request new frame
	if (newY < td.y) {
		requestAnimationFrame(function() {
			animate(td);
		});
	}
}

function click(e) {
	if (end) { return; }
	var x = Math.floor(e.offsetX * grid.width / canvas.width);
	var td = fill_col(x, turn);
	if (td == null) {
		alert("Colon is full!");
		return;
	}
	if (count >= grid.width * grid.height) {
		alert("Draw!");
		init();
		return;
	}

	if (doesWin(td)) {
		var msg = (turn == images.white) ? "White" : "Black";
		alert(msg + " won.");
	}
	turn = (turn == images.white) ? images.black : images.white;
}

function init() {
	turn = images.white;
	count = 0;
	end = false;
	grid.length = 0;
	for (var y = 0; y < grid.height; y++) {
		for (var x = 0; x < grid.width; x++) {
			td = {};
			td.x = x;
			td.y = y;
			td.player = "";
			grid.push(td);
		}
	}
}

var grid = [];
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

function fill_col(x, turn) {
	for (var y= grid.height -1; y>=0; --y) {
		var td = grid.get(x, y);
		if (td.player == "") {
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

function compte(x, y, player, dx, dy) {
	for (var i=1; i<=4; ++i) {
		x += dx;
		y += dy;
		var td = grid.get(x,y);
		if (!td || td.player != player) return i;
	}
	return i;
}

function compteDir(x, y, player, dx, dy) {
	return compte(x, y, player, dx, dy) + compte(x, y, player, -dx, -dy) -1;
}

function doesWin(td) {
	// horizontal
	if (compteDir(td.x, td.y, turn, 1, 0) >= 4) { return true; }
	// vertical
	if (compteDir(td.x, td.y, turn, 0, 1) >= 4) { return true; }
	// diag1
	if (compteDir(td.x, td.y, turn, 1, 1) >= 4) { return true; }
	// diag2
	if (compteDir(td.x, td.y, turn, 1, -1) >= 4) { return true; }
	return false;
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
				var x1 = x * grid.caseSize + grid.casePadding;
				var y1 = y * grid.caseSize + grid.casePadding;
				ctx.drawImage(td.player, x1, y1, grid.imageSize, grid.imageSize);
			}
		}
	}
}

loadImages(sources, function() {
		init();
		// animate(canvas, ctx, startTime);
		background = getImageBoard(canvas);
		fillGrid(null);
});

// vim: set ts=2 sw=2 list:
