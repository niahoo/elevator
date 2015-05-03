var _ = require('lodash')
window.Proc = require('proc')
var machina = require('machina')

function propStore (initialProps) {
	var store = _.merge({}, initialProps)
	return store
}

function after(duration, f) {
	return setTimeout(f,duration)
}

// var direction = {UP: 1, DOWN: -1}
var direction = {UP: 'UP', DOWN: 'DOWN'}
var doors = {CLOSE: 1, OPEN: -1}

// var signal = {
// 	CLOSING_DOORS: "CLOSING_DOORS",
// 	OPENING_DOORS: "OPENING_DOORS",
// }

var defaultProps = {
	direction: direction.UP, // no matter at the beginning but IT must be set
	currentStorey: 0,

	// WAYPOINTS. waypoints stores are sets, i.e we only consider the keys. Set
	// wp[2]to any value to stop at the storey which index is 2.
	// delete wp[2] when at the storey to clean the object keys. (clean the
	// three lists).
	// --
	// We handle two buttons at each storey : one to go down, one to go up
	waypointsUp: {}, // list of storeys that upmoving people want to reach
	waypointsDown: {}, // … the opposite
	// when in the cabin, the selected storeys are stored into waypoints,
	// because we do not know (IRL) which people pushed them ant where they want
	// to go. To implement undirected buttons at storeys, make a call to add
	// calls there and ignore waypointsUp/Down
	waypoints: {},

	// DOORS
	doorsState : doors.CLOSE,

	// TIMING
	timer: undefined, // A timer used to have cancellable setTimeout
	openAwaitingTime: 300, // time with the doors left open
	closedAwaitingTime: 300, // time after doors close and starting to move

	// CABIN AND ENGINES
	hardware: {
		cabinWeight: 200,
		tractionForce: 2,
		counterWeight: 200,
		doors: {
			openingDuration:200,
			closingDuration:200,
		}
	},

	// STOREYS
	storeys: [], // a list of storey objects
}

function createElevator() {
	var STOPPER = 3

	// props are available to both the proc and the client
	var props = extend({},defaultProps)

	var elevator = Proc.spawn({
		initialize: function(index) {
			return this.next()
		},
		deleteWaypoint: function(index) {
			console.log('deleteWaypoint', index)
			delete props.waypoints[index]
			delete props.waypointsUp[index]
			delete props.waypointsDown[index]
		},
		nextDestination: function () {
			console.log('nextDestination')
			function OR (a,b) { return a || b }
			var upwards = _.keys(_.merge({},props.waypointsUp, props.waypoints, OR))
			var downwards = _.keys(_.merge({},props.waypointsDown, props.waypoints, OR))
			// - If we are moving up, we want the next destination that is higher
			// than our current position and is a standard waypoint or is a
			// going-up waypoint.
			// - If none matches, we want the highest (most far away in our
			// direction) waypoint that wants to go downwards : from there, we
			// will take every people going downwards
			// - If none matches, we change direction and do the opposite in the
			// same order
			// - If note matches, we go idle

			// @todo give priority to people in the cabin ?
			var choices = {}
			choices[directio

			n.UP]   = _.min(_.filter(upwards, function(x){ return  x > props.currentStorey }).map(Number))
			choices[direction.DOWN] = _.max(_.filter(downwards, function(x){ return  x < props.currentStorey }).map(Number))
			// if there is no destination in the current direction, we should
			// change direction. the _.min / _.max values return Infinity / -Infinity
			// if the filter returns no value. So we want something finite
			if (! _.isFinite(choices[props.direction])) this.changeDirection()
			// here, direction could have changed. Again, we check if finite and
			// return either the next destination or false
			return (_.isFinite(choices[props.direction])
				? choices[props.direction]
				: false)
		}
		changeDirection: function() {
			console.log('changeDirection')
			if (props.direction === direction.UP) {
				props.direction = direction.DOWN
			} else if (props.direction === direction.DOWN) {
				props.direction = direction.UP
			}
		}
	})
	var clientApi = {
		addWaypointUp: function(index) {
			console.log('addWaypointUp',index)
			props.waypointsUp[index] = true
			this.handle('wakeup', wid())
		},
		addWaypointDown: function(index) {
			console.log('addWaypointDown',index)
			props.waypointsDown[index] = true
			this.handle('wakeup', wid())
		},
		addWaypoint: function(index) {
			console.log('addWaypoint',index)
			props.waypoints[index] = true
			this.handle('wakeup', wid())
		}
	}

}


// -- helpers (stateless) -----------------------------------------------------

/**
 * Returns the travel time for 1 storey at full speed, according to the
 * direction
 */
function storeyTravelDuration(direction, hardware) {
	if (direction === direction.UP) return 1000
	else return 1200
	// @todo use hardware.cabinWeight, hardware.tractionForce, hardware.counterWeight
}


exports.createElevator = createElevator
