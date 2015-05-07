function DestinationSelector(data, algorithm) {
	this.data = new DataWrapper(data)
	// we directly bind the algorithm function to our object since the function
	// uses our API and returns a destination
	this.getNext = algorithm
	// the 'candiates' Array will contain the selected destination. If the Array
	// lenghts comes to 1, then a destination is found
	this.candidates = []
}

DestinationSelector.prototype.setCandidates = function(candidates){
	// this is just a wrapper function for the property assignment to allow
	// adding debug
	console.log('new candidates', candidates)
	this.candidates = candidates
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
	this.setCandidates(
		Array.prototype.slice.call(arguments)
		.reduce(function(acc, wps){
			return acc.concat(wps)
		}, this.candidates)
	)
	return this
}

DestinationSelector.prototype.clear = function() {
	// arguments must be lists of waypoints
	this.setCandidates(
		Array.prototype.slice.call(arguments)
		.reduce(function(acc, wps){
			return acc.concat(wps)
		}, this.candidates)
	)
	return this
}

DestinationSelector.prototype.higherThan = function(n) {
	console.log('called higherThan',n)
	this.setCandidates(
		this.candidates.filter(function(c){
			console.log('%d > %d = %s',c,n,c>n)
			return c > n
		})
	)
	return this
}

DestinationSelector.prototype.LowerThan = function(n) {
	this.setCandidates(
		this.candidates.filter(function(c){
			return c < n
		})
	)
	return this
}

DestinationSelector.prototype.call = function(f) {
	this.setCandidates(f(this.candidates))
	return this
}

// Theese functions set only one candidate in the list

DestinationSelector.prototype.min = function(n) {
	this.setCandidates([Math.min.apply(null, this.candidates)])
	return this
}

DestinationSelector.prototype.max = function(n) {
	this.setCandidates([Math.max.apply(null, this.candidates)])
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
	// commands are calls to 'this', chained ; arguments are calls to the
	// DataWrapper API (which only defines getters but allows throwning an
	// exception if a non-defined property is asked, since the function won't
	// exist)

	// The orElse command is special, as it actually returns the destination if
	// any is found. As of input, it wraps the code coming after it downto the
	// end of input in a callback (like a monad binding).

	// only 'orElse' and 'force' actually retuns an integer as a selected
	// destination

	// '' @todo command to return idle

//* USER INPUT START ---------------------------------------------------------
		.addWaypoints(this.data.waypointsCabin())        // addWaypoints waypointsCabin
		// .addWaypoints(this.data.waypointsUp())        // addWaypoints waypointsCabin
		// .addWaypoints(this.data.waypointsSameDirection())      // addWaypoints waypointsSameDirection
		.higherThan(this.data.currentFloor())            // higherThan currentFloor
		.min()                                         // min
		.orElse(function(){                            // orElse # 1 start
			return this                                // // inserted by the parser
			.force(5)                                  // // force 5
		})                                             // orElse # 1 end
//* USER INPUT END -----------------------------------------------------------
	}) // end of base wrapping

	return result
}

function DataWrapper(data) {
	console.log('built DataWrapper with data',data)
	this.data = data
}

DataWrapper.prototype.currentFloor = function() { return this.data.currentFloor }
DataWrapper.prototype.currentDirection = function() { return this.data.currentDirection }
DataWrapper.prototype.waypointsCabin = function() { return this.data.waypointsCabin }
DataWrapper.prototype.waypointsUp = function() { return this.data.waypointsUp }
DataWrapper.prototype.waypointsDown = function() { return this.data.waypointsDown }
DataWrapper.prototype.waypointsSameDirection = function() {
	throw new Error('@todo function waypointsSameDirection!')
}

module.exports = DestinationSelector
