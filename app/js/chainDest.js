
var  l = console.log.bind(console)
var  ll = console.log.bind(console,' - list')

function DestinationSelector() {
	this.candidates = []
}

// Most of the prototype functions return <this>, allowing for a simple
//  chain of calls, hiding the state

DestinationSelector.prototype.d = function() {
	// DUMP function
	var args = Array.prototype.slice.call(arguments)
	console.log.apply(console, args)
	return this
}

DestinationSelector.prototype.addWaypoints = function() {
	// arguments must be lists of waypoints
	this.candidates = Array.prototype.slice.call(arguments)
		.reduce(function(acc, wps){
			return acc.concat(wps)
		}, this.candidates)
	return this
}

DestinationSelector.prototype.clear = function() {
	// arguments must be lists of waypoints
	this.candidates = Array.prototype.slice.call(arguments)
		.reduce(function(acc, wps){
			return acc.concat(wps)
		}, this.candidates)
	return this
}

DestinationSelector.prototype.higherThan = function(n) {
	this.candidates = this.candidates.filter(function(c){
		return c > n
	})
	return this
}

DestinationSelector.prototype.LowerThan = function(n) {
	this.candidates = this.candidates.filter(function(c){
		return c < n
	})
	return this
}

DestinationSelector.prototype.call = function(f) {
	this.candidates = f(this.candidates)
	return this
}

// Theese functions returns values, at the end of the chain

DestinationSelector.prototype.min = function(n) {
	return Math.min.apply(null, this.candidates)
}

DestinationSelector.prototype.max = function(n) {
	return Math.max.apply(null, this.candidates)
}

// ---------------------------------------------------------------------------

var go = true

var data = {
	waypoints: {1: true,          4: true,          5: true,          7: true,          8: true},
	waypointsUp: {2: true,          4: true,          5: true,          6: true,          8: true},
	waypointsDown: {3: true,          4: true,          2: true,          8: true,          9: true},
}

function waypoints()     { return Object.keys(data.waypoints).map(Number) }
function waypointsUp()   { return Object.keys(data.waypointsUp).map(Number) }
function waypointsDown() { return Object.keys(data.waypointsDown).map(Number) }

// the current floor
function current() { return 15 }

function id (x) { return x }


function userFunction(destinationSelector) {
	var result = destinationSelector

//* USER INPUT START ---------------------------------------------------------

	.addWaypoints(waypoints())    //   addWaypoints waypoints
	.addWaypoints(waypointsUp())  //   addWaypoints waypointsUp
	.higherThan(current())        //   higherThan current
	.min()                        //   min

//* USER INPUT END -----------------------------------------------------------

	return result
}


console.log('selected destination', userFunction(new DestinationSelector()))
