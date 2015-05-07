function DestinationSelector(data, algorithm) {
	this.data = data
	// we directly bind the algorithm function to our object since the function
	// uses our API and returns a destination
	this.getNext = algorithm
	// the 'candiates' Array will contain the selected destination. If the Array
	// lenghts comes to 1, then a destination is found
	this.candidates = []
}

DestinationSelector.buildSelector = function(data){
	// data contains :
	//	.waypointsUp
	//	.waypointsDown
	//	.waypointsCabin
	//	.currentFloor
	//	.currentDirection
	//	@todo control ?
	console.error('@todo parse user defined algorithm and create a function')
	var algorithm = FAKE_COMPILED_USER_ALGORITHM
	return new DestinationSelector(data,algorithm)
}


// Most of the prototype functions return <this>, allowing for a simple chain
// of calls, hiding the state

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

function FAKE_COMPILED_USER_ALGORITHM() {
	// the function will be bound to the selector, so we can directly use our
	// functions there. 'orElse' bounds its callback to the selector too
	var result = this.orElse(function(){ // orElse 0 start
		return this /* chain calls */

	// user input (right comments below) consists in commands and arguments
	// commands are calls to 'this', chained ; arguments are properties of
	// 'this.data'. The orElse command is special, it wraps the following code
	// until the end of input in a callback (like a monad binding).
//* USER INPUT START ---------------------------------------------------------
		.addWaypoints(this.data.waypointsCabin)        // addWaypoints waypointsCabin
		.addWaypoints(this.data.waypointsSameDir)      // addWaypoints waypointsSameDir
		.higherThan(this.data.currentFloor)            // higherThan currentFloor
		.min()                                         // min
		.orElse(function(){                            // orElse # 1 start
			return this                                // // inserted by the parser
			.force(5)                                  // // force 5
		})                                             // orElse # 1 end
//* USER INPUT END -----------------------------------------------------------
	}) // end of base wrapping

	return result
}

module.exports = DestinationSelector
