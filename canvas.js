"use strict";

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

function animate(td, startTime) {
	// update
	var time = (new Date()).getTime() - startTime;

	// falling
	var newY = 0.1 * time * time / 1000 + 0.01 * time;
	if (newY > td.y) { newY = td.y; }

	// clear
	fillGrid(td);
	if (td.player != images.black) {
		DrawChip(td.player, td.x, td.y, 0.5);
	}
	DrawChip(td.player, td.x, newY, 1);

	// request new frame
	if (newY < td.y) {
		requestAnimationFrame(function() {
			animate(td, startTime);
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


function handle_play(x) {
	// console.log("handle_play", turn);
	var td = fill_col(x, turn, false, grid, true);
	if (td == null) {
		WriteMessage("Column is full!", null);
		return;
	}
	if (count >= grid.width * grid.height) {
		end = true;
		WriteMessage("Draw!", "New Game");
		return;
	}

	var pwin = doesWin(td, grid, turn);
	wining_chips = pwin;
	if (pwin.length >= 4) {
		var msg = (turn == images.white) ? "White" : "Black";
		WriteMessage(msg + " won.", "New Game");
		end = true;
		return;
	}
	HideMessage();
	turn = nextTurn(turn);
}

function ia_random() {
	var x = 0;
	var td = null;
	while (td == null) {
		x = Math.floor(Math.random() * 7);
		td = fill_col(x, turn, true, grid, true);
	}
	return x;
}

function max(a, b) {
	return (a>b)?a:b;
}

function min(a, b) {
	return (a<b)?a:b;
}

const MAXREC = 5;

function getMinScore(turn, grid, reclim) {
	var score = [];

	for (var i=0; i< grid.width; i++) {
		var ngrid = grid.clone();
		var y = getMaxCol(ngrid, i);
		if (y == null) {
			score.push(1000);
		} else {
			var td = ngrid.get(i, y);
			td.player = turn;

			var pwin = -doesWin(td, ngrid, turn).length;
			if (pwin <= -4) {
				score.push(-200 - reclim * 0.01);
				return score;
			} else if (reclim < MAXREC) {
				var below = getMaxScore(nextTurn(turn), ngrid, reclim+1);
				var max_below = Math.max( ...below );
				score.push( max_below );
			} else {
				score.push(pwin - reclim*0.01);
			}
		}
	}
	return score;
}

function getMaxScore(turn, grid, reclim) {
	var score = [];

	for (var i=0; i< grid.width; i++) {
		var ngrid = grid.clone();
		var y = getMaxCol(ngrid, i);
		if (y == null) {
			score.push(-1000);
		} else {
			var td = ngrid.get(i, y);
			td.player = turn;

			var pwin = doesWin(td, ngrid, turn).length;
			if (pwin >= 4) {
				score.push(200 + reclim * 0.01);
				return score;
			} else if (reclim < MAXREC) {
			  var below = getMinScore(nextTurn(turn), ngrid, reclim+1);
			  var min_below = Math.min( ...below );
			  score.push( min_below );
			} else {
				score.push(pwin + reclim*0.01);
			}
		}
	}
	return score;
}

function ia_defense(my_turn, grid) {
	var myScore = getMaxScore(my_turn, grid, 0);
	var score = myScore;
	console.log(score);

	var max = Math.max(...score);

	var x=Math.floor(Math.random()*score.length);
	while (score[x] < max) {
		x = Math.floor(Math.random()*score.length);
	}
	return x;
}

function play_auto() {
	// var x = ia_random();
	var x = ia_defense(turn, grid);
	handle_play(x);
}

function click(e) {
	if (end) { return; }
	var x = Math.floor(e.offsetX * grid.width / canvas.width);
	handle_play(x);
	if (turn == images.black) {
		canvas.removeEventListener('click', click);
		canvas.removeEventListener('mousemove', mouse);
		setTimeout(function() {
			play_auto();
			canvas.addEventListener('click', click);
			canvas.addEventListener('mousemove', mouse);
		}, 400);
	}
}

function mouse(e) {
	if (end) { return; }
	var x = Math.floor(e.offsetX * grid.width / canvas.width);
	fill_col(x, turn, true, grid, true);
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
			var td = {};
			td.x = x;
			td.y = y;
			td.player = "";
			grid.push(td);
		}
	}

	fillGrid(null);
}

function getMaxCol(grid, x) {
	for (var y= grid.height -1; y>=0; --y) {
		var td = grid.get(x, y);
		if (td == null) { return null; }
		if (td.player == "") { return y; }
	}
	return null;
}

function fill_col(x, turn, preview, grid, display) {
	if (end) return;
	var y = getMaxCol(grid,x);
	var td = grid.get(x, y);
	if (td != null) {
		if (preview == true) {
			if (display) {
				fillGrid(null);
				DrawChip(turn, x, y, 0.5);
			}
			return td;
		}
		td.player = turn;
		count++;
		if (display) { animate(td, (new Date()).getTime()); }
	}
	return td;
}


function compte(x, y, player, dx, dy, pwin, grid) {
	for (var i=0; i<=4; ++i) {
		var td = grid.get(x,y);
		if (!td || td.player != player) return pwin;
		pwin.add(x,y);
		x += dx;
		y += dy;
	}
}

function compteDir(x, y, player, dx, dy, grid) {
	var pwin = [];
	pwin.add = function(x, y) {
		for (var i=0; i< this.length; i++) {
			if (this[i].x == x && this[i].y == y) { return; }
		}
		this.push({x: x, y: y});
	}
	compte(x, y, player, dx, dy, pwin, grid);
	compte(x, y, player, -dx, -dy, pwin, grid);
	return pwin;
}

function doesWin(td, grid, turn) {
	// horizontal
	var pwin = compteDir(td.x, td.y, turn, 1, 0, grid);
	var maxpwin = pwin;
 	if (pwin.length >= 4) { return pwin; }
	// vertical
	pwin = compteDir(td.x, td.y, turn, 0, 1, grid);
	if (pwin.length > maxpwin.length) { maxpwin = pwin; }
 	if (pwin.length >= 4) { return pwin; }
	// diag1
	pwin = compteDir(td.x, td.y, turn, 1, 1, grid);
	if (pwin.length > maxpwin.length) { maxpwin = pwin; }
 	if (pwin.length >= 4) { return pwin; }
	// diag2
	pwin = compteDir(td.x, td.y, turn, 1, -1, grid);
	if (pwin.length > maxpwin.length) { maxpwin = pwin; }
 	if (pwin.length >= 4) { return pwin; }
	return maxpwin;
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

function nextTurn(turn) {
	return (turn == images.white) ? images.black : images.white;
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
	};

	grid.clone = function() {
		var n = [];
		for (var i=0; i<this.size; i++) {
			var td = this[i];
			var ntd = {};
			for (var k in td) { ntd[k] = td[k]; }
			n.push(ntd);
		}
		n.clone = this.clone;
		n.length = this.length;
		n.size = this.size;
		n.width = this.width;
		n.height = this.height;
		n.get = function(x,y) {
			if (x < 0 || x >= this.width) { return null; }
			if (y < 0 || y >= this.height) { return null; }
			return this[x + y*this.width];
		};
		return n;
	}

	background = getImageBoard(canvas);
	init();
	canvas.addEventListener('click', click);
	canvas.addEventListener('mousemove', mouse);
});

// vim: set ts=2 sw=2 list:
