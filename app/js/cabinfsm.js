var FSM = require('fsm')

var defaultHardware = {
	cabinWeight: 200,
	tractionForce: 2,
	counterWeight: 200,
	doors: {
		openingDuration:200,
		closingDuration:200,
	}
}

var doorsStates = {CLOSE:-1, OPEN:1}

var CabinFSM = FSM.extend('CabinFSM', {

	hardware: defaultHardware,
	openAwaitingTime: 300,	 // default time with the doors left open
	closedAwaitingTime: 300, // default time after doors close before set destination & move
	doorsStates: doorsStates,
	state: {}, // state is a custom object
	doorsState: doorsStates.CLOSE,

	initialize: function(control) {
		console.log('CabinFSM initialize args', arguments)
		this.control = control // control is the elevator main controller
		// at the beginning, doors are close and the cabin is stopped, so we can
		// just call 'idle'
		return this.next(this.idle)
	},

	idle: function() {
		return this.receive('wakeup', this.onWakeUp)
		._(function(anyMessage){
			console.log('CabinFSM received unattended message : ', anyMessage)
			return this.next(this.idle,100)
		})
	},

	onWakeUp: function() {
		// we could have received many 'wakeup' messages so we flush them
		return this.receive('wakeup', this.onWakeUp) // we loop for all wakeup messages
		.after(0, function(){
			// and now we can do the real work

			var nextDest = this.control.getNextDestination()
			if (! nextDest) {
				// no destination, just loop
				console.log('no destination to go')
				return this.next(this.idle)
			} else {
				console.log('Cabin going to destination %s (@todo)', nextDest)
				return this.exit()
			}
		})
	}
})

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


module.exports = CabinFSM
