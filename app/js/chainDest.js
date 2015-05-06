var isFinite = require('lodash/lang/isFinite')


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

// Theese functions set only one candidate in the list

DestinationSelector.prototype.min = function(n) {
	this.candidates = [Math.min.apply(null, this.candidates)]
	return this
}

DestinationSelector.prototype.max = function(n) {
	this.candidates = [Math.max.apply(null, this.candidates)]
	return this
}

DestinationSelector.prototype.force = function(n) {
	return n
}

DestinationSelector.prototype.orElse = function(next) {
	// if there's only one candidate left and it's a storey (not Infinity or
	// -Inifnity), returns it.

	// else, execute the callback 'next' containing a new selection. But before
	// clean the new candidates
	if (this.candidates.length === 1 && isFinite(this.candidates[0])) {
		return this.candidates[0]
	} else {
		return next.bind(this)()
	}
}

// ---------------------------------------------------------------------------

var go = true

var data = {
	waypointsCabin: {1: true,          4: true,          5: true,          7: true,          8: true},
	waypointsUp:    {2: true,          4: true,          5: true,          6: true,          8: true},
	waypointsDown:  {3: true,          4: true,          2: true,          8: true,          9: true},
}

function waypointsCabin() { return Object.keys(data.waypointsCabin).map(Number) }
function waypointsUp()    { return Object.keys(data.waypointsUp).map(Number)    }
function waypointsDown()  { return Object.keys(data.waypointsDown).map(Number)  }

// returns waypointsUp if direction is UP, waypointsDown if direction is DOWN
function waypointsSameDir() {
	if (currentDirection() === direction.UP) {
		return waypointsUp()
	} else {
		return waypointsDown()
	}
}

var direction = {UP: 'UP', DOWN: 'DOWN'}

function currentFloor() { return 15 }
function currentDirection() { return direction.UP }

function id (x) { return x }


function userFunction(destinationSelector) {
	var result = destinationSelector.orElse(function(){ // orElse 0 start
		return this /* chain calls */

//* USER INPUT START ---------------------------------------------------------

		.addWaypoints(waypointsCabin())    //   addWaypoints waypointsCabin
		.addWaypoints(waypointsSameDir())  //   addWaypoints waypointsSameDir
		.higherThan(currentFloor())        //   higherThan currentFloor
		.min()                             //   min
		.orElse(function(){                //	orElse # 1 start
			return this /* chain calls */
			.force(5)                      //	force 5
		})                                 //	orElse # 1 end

//* USER INPUT END -----------------------------------------------------------
	}) //	orElse 0 end

	return result
}


console.log('selected destination', userFunction(new DestinationSelector()))
