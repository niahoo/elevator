var direction = require('constants').direction

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

DestinationSelector.prototype.trace = function(code) {
	console.log('%c%s','color:blue;font-weight:bold',code)
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
	this.setCandidates([])
}

// following filters higherThan(n) if current direction is up, or lowerThan(n)
// if current direction is DOWN
DestinationSelector.prototype.following = function(n) {
	var dir = this.data.currentDirection()
	console.log('called following %s, direction is %s',n,dir)
	switch (dir) {
		case direction.UP : return this.higherThan(n)
		case direction.DOWN : return this.LowerThan(n)
		default: throw new Error('bad direction')
	}
}

DestinationSelector.prototype.preceding = function(n) {
	var dir = this.data.currentDirection()
	console.log('called preceding %s, direction is %s',n,dir)
	switch (dir) {
		case direction.UP : return this.LowerThan(n)
		case direction.DOWN : return this.higherThan(n)
		default: throw new Error('bad direction')
	}
}

// selects a floor if present
DestinationSelector.prototype.checkFloor = function(n) {
	var found = false
	for (var i = 0, l = this.candidates.length; i < l; i++) {
		if (this.candidates[i] === n) found = true
		break
	}
	// the floor is found in the waypoints, we set it as our candidate. If not
	// foud, we set all the
	if (found) {
		this.setCandidates([n])
	}
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

DestinationSelector.prototype.nearest = function(n) {
	// takes the candidates that has the lower range from the provided <n> floor
	if (this.candidates.length === 0)
		return this
	var minRange = 99999
	var nearest = null
	for (var i = 0, c, range, l = this.candidates.length; i < l; i++) {
		c = this.candidates[i], range = Math.abs(c - n)
		if (range < minRange) {
			minRange = range
			nearest = c
		}
		break
	}
	this.setCandidates([nearest])
	return this
}

DestinationSelector.prototype.farest = function(n) {
	// takes the candidates that has the higher range from the provided <n> floor
	if (this.candidates.length === 0)
		return this
	var maxRange = 0
	var farest = null
	for (var i = 0, c, range, l = this.candidates.length; i < l; i++) {
		c = this.candidates[i], range = Math.abs(c - n)
		if (range > maxRange) {
			maxRange = range
			farest = c
		}
		break
	}
	this.setCandidates([farest])
	return this
}

DestinationSelector.prototype.max = function(n) {
	this.setCandidates([Math.max.apply(null, this.candidates)])
	return this
}

// Theese functions returns a storey number

DestinationSelector.prototype.force = function(n) {
	return n
}

DestinationSelector.prototype.stop = function() {
	return null
}

DestinationSelector.prototype.orElse = function(next) {
	// if there's only one candidate left and it's a storey (not Infinity or
	// -Inifnity), returns it.

	// else, execute the callback 'next' containing a new selection. But before
	// clean the new candidates
	if (this.candidates.length === 1 && isFinite(this.candidates[0])) {
		console.log('Candidate matches')
		return this.candidates[0]
	} else {
		this.clear()
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

	// @todo if there is no waypoint at all, do not run the algorithm and return
	// null immediately

//* USER INPUT START ---------------------------------------------------------
		// # Try the current floor
		.trace('addWaypoints allWaypoints')                    // addWaypoints allWaypoints
		.addWaypoints(this.data.allWaypoints())
		.trace('checkFloor currentFloor')                      // checkFloor currentFloor
		.checkFloor(this.data.currentFloor())
		.trace('orElse')                                      // orElse
		.orElse(function(){
			return this
			// # Try the following waypoints going in the same direction and
			// # pick the closest
			.trace('addWaypoints waypointsCabin')                 // addWaypoints waypointsCabin
			.addWaypoints(this.data.waypointsCabin())
			.trace('addWaypoints waypointsSameDirection')         // addWaypoints waypointsSameDirection
			.addWaypoints(this.data.waypointsSameDirection())
			.trace('following currentFloor')                      // following currentFloor
			.following(this.data.currentFloor())
			.trace('nearest')                                         // nearest currentFloor
			.nearest(this.data.currentFloor())
			.trace('orElse')                                      // orElse
			.orElse(function(){
				// # Try the following waypoints going in the opposite direction
				// # pick the farest so we will go all the way back
				return this
				.trace('addWaypoints waypointsCabin')
				.addWaypoints(this.data.waypointsCabin())
				.trace('addWaypoints waypointsOtherDirection')         // addWaypoints waypointsOtherDirection
				.addWaypoints(this.data.waypointsOtherDirection())
				.trace('following currentFloor')                      // following currentFloor
				.following(this.data.currentFloor())
				.trace('farest')                                         // farest currentFloor
				.farest(this.data.currentFloor())
				.trace('orElse')                                      // orElse
				.orElse(function(){
					// # As we do not need to go in a following waypoint, we
					// # will go back to a preceding waypoint, and follow the
					// # same logic. Instead of retyping the whole algorithm in
					// # the opposite direction, we will simply change our
					// # direction and start over. Then, if nothing was found
					// # the second time we reach this point, we do not want to
					// # re-loop. So this commands sets a flag
					.trace('changeDirection')
					.trace('Loop')



					return this
					.trace('stop')                                       // stop
					.stop()
				})
			})
		})
//* USER INPUT END -----------------------------------------------------------
	}) // end of base wrapping

	return result
}

function DataWrapper(dataset) {
	console.log('built DataWrapper with dataset',dataset)
	this.dataset = dataset
}


DataWrapper.prototype.currentFloor = function() { return this.dataset.currentFloor }
DataWrapper.prototype.currentDirection = function() { return this.dataset.currentDirection }
DataWrapper.prototype.waypointsCabin = function() { return this.dataset.waypointsCabin }
DataWrapper.prototype.waypointsUp = function() { return this.dataset.waypointsUp }
DataWrapper.prototype.waypointsDown = function() { return this.dataset.waypointsDown }
DataWrapper.prototype.allWaypoints = function() {
	return this.waypointsUp()
		.concat(this.waypointsDown())
		.concat(this.waypointsCabin())
}
DataWrapper.prototype.waypointsSameDirection = function() {
	switch (this.currentDirection()) {
		case direction.UP : return this.waypointsUp()
		case direction.DOWN : return this.waypointsDown()
		default: throw new Error('bad direction')
	}
}
DataWrapper.prototype.waypointsOtherDirection = function() {
	switch (this.currentDirection()) {
		case direction.DOWN : return this.waypointsUp()
		case direction.UP : return this.waypointsDown()
		default: throw new Error('bad direction')
	}
}

module.exports = DestinationSelector
