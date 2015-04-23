(function(){


function propStore (initialProps) {
	var store = _.merge({}, initialProps)
	return store
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

	// TIMER
	// A timer used to have cancellable setTimeouts
	timer: undefined,

	// CABIN AND ENGINES
	hardware: {
		cabinWeight: 200,
		tractionForce: 2,
		counterWeight: 200
	},

	// STOREYS
	storeys: [], // a list of storey objects
}

function createElevator(_props) {

	// this handles state data @todo use immutable data (deep (mori ?), Immutable stores mutable objects)
	var props = propStore(_.merge({},defaultProps,_props))

	var ElevatorFsm = machina.Fsm.extend({
		namespace: 'elevator',
		initialState: 'uninitialized',
		initialize: function() {},
		states: {
			uninitialized: {
				_onEnter: function(){
					this.deferUntilTransition('maybeMove')
					this.transition('maybeMove')
				}
			},
			idle: {
				_onEnter: function(){
					console.log('Elevator idle')
				},
				wakeup: 'maybeMove'
			},
			// maybeMove is the state jsut before the elevator moves. It must
			// be transitionned to AFTER the doors were closed, and AFTER a
			// little more time allowing people to push a storey button to go to
			maybeMove: {
				_onEnter: function(){
					this.deferUntilTransition()
					console.log('Elevator maybeMove')
					var nextIndex = this.nextDestination()
					if (nextIndex !== false) { // next can be 0
						var diff = Math.abs(nextIndex - props.currentStorey)
						var duration = diff * storeyTravelDuration(props.direction, props.hardware)
						this.emit('moving', nextIndex, duration)
						var self = this
						props.timer = setTimeout(function(){
							props.currentStorey = nextIndex
							self.emit('waypointReached', nextIndex)
						}, duration)
					} else {
						this.transition('idle')
					}
				}
			},
		},
		// public API --
		getProps: function() {
			return _.cloneDeep(props)
		},
		changeDirection: function() {
			console.log('changeDirection')
			if (props.direction === direction.UP) {
				props.direction = direction.DOWN
			} else if (props.direction === direction.DOWN) {
				props.direction = direction.UP
			}
		},
		addWaypointUp: function(index) {
			console.log('addWaypointUp',index)
			props.waypointsUp[index] = true
			this.handle('wakeup')
		},
		addWaypointDown: function(index) {
			console.log('addWaypointDown',index)
			props.waypointsDown[index] = true
			this.handle('wakeup')
		},
		addWaypoint: function(index) {
			console.log('addWaypoint',index)
			props.waypoints[index] = true
			this.handle('wakeup')
		},
		nextDestination: function () {
			console.log('nextDestination')
			function OR (a,b) { return a || b }
			var upwards = _.keys(_.merge({},props.waypointsUp, props.waypoints, OR))
			var downwards = _.keys(_.merge({},props.waypointsDown, props.waypoints, OR))
			// if we are moving up, we want the next destination that is higher
			// than our current position, and the opposite if moving downwards
			// so for moving up, we want the MINIMUM higher.
			// We convert the keys to Numbers as _.isFinite returns true only for numbers
			var choices = {}
			choices[direction.UP]   = _.min(_.filter(upwards, function(x){ return  x > props.currentStorey }).map(Number))
			choices[direction.DOWN] = _.max(_.filter(downwards, function(x){ return  x < props.currentStorey }).map(Number))
			console.log('direction choices', choices)
			console.log('direction', props.direction)
			// if there is no destination in the current direction, we should
			// change direction. the _.min / _.max values return Infinity / -Infinity
			// if the filter returns no value. So we want something finite
			if (! _.isFinite(choices[props.direction])) this.changeDirection()
			console.log('direction', props.direction)
			// here, direction could have changed. Again, we check if finite and
			// return either the next destination or false
			return (_.isFinite(choices[props.direction])
				? choices[props.direction]
				: false)
		},
	})

	return new ElevatorFsm()
}

window.createElevator = createElevator

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

}())
