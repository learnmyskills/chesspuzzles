
var STACK_SIZE = 100;                 // maximum size of undo stack

var board = null
var $board = $('#myBoard')
var game = new Chess()
var globalSum = 0                     // always from black's perspective. Negative for white's perspective.
var currPos=0
var currMov=0
var solved=0
var tpoints=0;
var points=5;
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'

var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null
var positionCount;
var cFen;

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
}
var positions = [
    {fen: 'Bnkr1r2/2p2R2/pp4pb/2pPp2p/N3P2P/8/PPP5/1K3R2 w - - 3 28',
     moves: ['Nxb6+','cxb6', 'Bb7#']},
    {fen: 'r2qk2r/3bppbp/p1np1np1/1p6/3NP3/1BN1BP2/PPPQ2PP/R3K2R w KQkq - 2 11',
     moves: ['Bh6', 'Bxh6', 'Qxh6', 'Nxd4', 'Qg7', 'Rf8']},
	{ fen:'8/3k4/PKn2p2/2P5/8/8/7P/8 w - - 1 53', 
	 moves:['Kb7','f5','h4','f4','h5','f3','a7','Nxa7','h6','Nc6','h7','Nd8+','Kb6','Nf7','c6+','Kc8','h8=Q+','Nxh8']}];



board = Chessboard('myBoard', config)

timer = null;


/* 
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

var weights = { 'p': 100, 'n': 280, 'b': 320, 'r': 479, 'q': 929, 'k': 60000, 'k_e': 60000 };
var pst_w = {
    'p':[
            [ 100, 100, 100, 100, 105, 100, 100,  100],
            [  78,  83,  86,  73, 102,  82,  85,  90],
            [   7,  29,  21,  44,  40,  31,  44,   7],
            [ -17,  16,  -2,  15,  14,   0,  15, -13],
            [ -26,   3,  10,   9,   6,   1,   0, -23],
            [ -22,   9,   5, -11, -10,  -2,   3, -19],
            [ -31,   8,  -7, -37, -36, -14,   3, -31],
            [   0,   0,   0,   0,   0,   0,   0,   0]
        ],
    'n': [ 
            [-66, -53, -75, -75, -10, -55, -58, -70],
            [ -3,  -6, 100, -36,   4,  62,  -4, -14],
            [ 10,  67,   1,  74,  73,  27,  62,  -2],
            [ 24,  24,  45,  37,  33,  41,  25,  17],
            [ -1,   5,  31,  21,  22,  35,   2,   0],
            [-18,  10,  13,  22,  18,  15,  11, -14],
            [-23, -15,   2,   0,   2,   0, -23, -20],
            [-74, -23, -26, -24, -19, -35, -22, -69]
        ],
    'b': [ 
            [-59, -78, -82, -76, -23,-107, -37, -50],
            [-11,  20,  35, -42, -39,  31,   2, -22],
            [ -9,  39, -32,  41,  52, -10,  28, -14],
            [ 25,  17,  20,  34,  26,  25,  15,  10],
            [ 13,  10,  17,  23,  17,  16,   0,   7],
            [ 14,  25,  24,  15,   8,  25,  20,  15],
            [ 19,  20,  11,   6,   7,   6,  20,  16],
            [ -7,   2, -15, -12, -14, -15, -10, -10]
        ],
    'r': [  
            [ 35,  29,  33,   4,  37,  33,  56,  50],
            [ 55,  29,  56,  67,  55,  62,  34,  60],
            [ 19,  35,  28,  33,  45,  27,  25,  15],
            [  0,   5,  16,  13,  18,  -4,  -9,  -6],
            [-28, -35, -16, -21, -13, -29, -46, -30],
            [-42, -28, -42, -25, -25, -35, -26, -46],
            [-53, -38, -31, -26, -29, -43, -44, -53],
            [-30, -24, -18,   5,  -2, -18, -31, -32]
        ],
    'q': [   
            [  6,   1,  -8,-104,  69,  24,  88,  26],
            [ 14,  32,  60, -10,  20,  76,  57,  24],
            [ -2,  43,  32,  60,  72,  63,  43,   2],
            [  1, -16,  22,  17,  25,  20, -13,  -6],
            [-14, -15,  -2,  -5,  -1, -10, -20, -22],
            [-30,  -6, -13, -11, -16, -11, -16, -27],
            [-36, -18,   0, -19, -15, -15, -21, -38],
            [-39, -30, -31, -13, -31, -36, -34, -42]
        ],
    'k': [  
            [  4,  54,  47, -99, -99,  60,  83, -62],
            [-32,  10,  55,  56,  56,  55,  10,   3],
            [-62,  12, -57,  44, -67,  28,  37, -31],
            [-55,  50,  11,  -4, -19,  13,   0, -49],
            [-55, -43, -52, -28, -51, -47,  -8, -50],
            [-47, -42, -43, -79, -64, -32, -29, -32],
            [ -4,   3, -14, -50, -57, -18,  13,   4],
            [ 17,  30,  -3, -14,   6,  -1,  40,  18]
        ],

    // Endgame King Table
    'k_e': [
            [-50, -40, -30, -20, -20, -30, -40, -50],
            [-30, -20, -10,   0,   0, -10, -20, -30],
            [-30, -10,  20,  30,  30,  20, -10, -30],
            [-30, -10,  30,  40,  40,  30, -10, -30],
            [-30, -10,  30,  40,  40,  30, -10, -30],
            [-30, -10,  20,  30,  30,  20, -10, -30],
            [-30, -30,   0,   0,   0,   0, -30, -30],
            [-50, -30, -30, -30, -30, -30, -30, -50]
        ]
};
var pst_b = {
    'p': pst_w['p'].slice().reverse(),
    'n': pst_w['n'].slice().reverse(),
    'b': pst_w['b'].slice().reverse(),
    'r': pst_w['r'].slice().reverse(),
    'q': pst_w['q'].slice().reverse(),
    'k': pst_w['k'].slice().reverse(),
    'k_e': pst_w['k_e'].slice().reverse()
}

var pstOpponent = {'w': pst_b, 'b': pst_w};
var pstSelf = {'w': pst_w, 'b': pst_b};

function checkStatus (color) {
    if (color==='comp')
    {
	      $('#status').html(" ")
    }
	else 
    {
      $('#status').html(`Not a correct Move, Try again.`) ;
        return false;
    }
    return true;
}



function loadPGN() {
jQuery.get('https://arunmoorthattil.github.io/chess-puzzle/css/pgn_data.pgn', function (data) {
	var fen=positions[currPos++].fen;
      	console.log(fen)
	game.load(fen);
         board.position(game.fen());
	window.setTimeout(function() {makeBestMove('b')}, 250)
	     
});
}

/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {
	console.log(currPos);
        var mv=positions[currPos].moves[currMov];
        var move= game.move(mv);
	currMov+=1;
        board.position(game.fen());
	checkStatus('comp');
    if (color ==='b')
    {
       // Highlight black move
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'
        $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)
    }
    else
    {
          // Highlight white move
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.square-' + move.from).addClass('highlight-white')
        squareToHighlight = move.to
        colorToHighlight = 'white'

        $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)
    }
 if(positions[currPos].moves.length===currMov){
	 console.log(tpoints);
	  console.log(points);
		tpoints+=points;
		solved+=1;
		points=5;
	 if(positions.length-1===currPos){
	        $('#status').html(" No more puzzles left.Come back tomorrow for more interesting puzzles");
	 } else{
		   $('#status').html(" Great . You have solved the Puzzle"); 
	 }	 
		 $('#score').html("Puzzles: "+solved);
		$('#points').html("Points: "+tpoints);
	        $('#final').html(tpoints);
	    
	
}
	
}


/* 
 * Event listeners for various buttons.
 */
$('#start').on('click', function () {
	document.getElementById("start").disabled = true;
	document.getElementById("Next").disabled = false;
	currPos=0;
        var fen=positions[currPos].fen;
	game.load(fen);
         board.position(game.fen());
	if(game.turn()!='w'){
	window.setTimeout(function() {makeBestMove(game.turn() )}, 250)
	}
	
})
$('#Next').on('click', function() {
	currPos+=1;
	if(currPos===positions.length-1){
	document.getElementById("Next").disabled = true;
		console.log("next disabled");
	}
         var fen=positions[currPos].fen;
	 currMov=0;
	console.log(fen);
	 game.load(fen);
         board.position(game.fen());
	console.log(game);
	if(game.turn()!='w'){
	window.setTimeout(function() {makeBestMove(game.turn())}, 250)
	}
})


var undo_stack = [];


/* 
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares () {
    $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
    var $square = $('#myBoard .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

function onDragStart (source, piece) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // or if it's not that side's turn
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop (source, target) {
    undo_stack = [];
    removeGreySquares();
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // Illegal move
    if (move === null) return 'snapback'
      var mv=positions[currPos].moves[currMov];
	color=game.turn();
	
  if (move.san!== mv) { points-=1;  
  if (color ==='b')
    {
    checkStatus('black');	    
    }else {
	    checkStatus('white');
    }   
		   
return game.undo();
}
      currMov+=1;
	if(positions[currPos].moves.length===currMov){
		tpoints+=points;
		solved+=1;
		points=5;
	       	 $('#score').html("Puzzles: "+solved);
		$('#points').html("points: "+tpoints);
		 $('#final').html(tpoints);
if(positions.length-1===currPos){
$('#status').html(" No more puzzles left.Come back tomorrow for more interesting puzzles");
} else{
 $('#status').html(" Great . You have solved the Puzzle"); 
}				
} else{
// Make the best move for black
        window.setTimeout(function() {
            makeBestMove(game.turn());
        }, 250)
    }
}

function onMouseoverSquare (square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the square they moused over
    greySquare(square)

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
    }
}

function onMouseoutSquare (square, piece) {
    removeGreySquares()
}

function onSnapEnd () {
    board.position(game.fen())
}
