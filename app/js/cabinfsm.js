var constants = require('constants')


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
	currentAltitude: 0,
	nextAltitude: 0,

	initialize: function(control) {
		console.log('CabinFSM initialize args', arguments)
		this.control = control // control is the elevator main controller
		// at the beginning, doors are close and the cabin is stopped, so we can
		// just call 'idle'. idle require that the elevator is ready to move.
		return this.next(this.idle)
	},

	idle: function() {
		console.log('cabin idle')
		// here, the doors are close. We can notify our controller that we are
		// ready to do some movement
		return this
		.receive({command:'MOVE'}, function(message){
			console.log('received MOVE command', message)
			this.nextAltitude = message.altitude
			return this.next(this.onMove)
		})
		.receive('wakeup', function(message){
			// we received a wakeup notification, telling us that there is work
			// to do. we will flush all the others wakeup messages in queue and
			// then send a notification telling we're idle. So we will expect a
			// command message in return
			return (function flush() {
				console.log('flushing wakeups')
				return this.receive('wakeup', flush)
				.after(0, function(){
					return this.next(this.idle)
				})
			}).bind(this)()
		})
		._(function(anyMessage){
			console.log('CabinFSM received unattended message : ', anyMessage)
			return this.next(this.idle,100)
		})
	},

	onMove: function() {
		console.error('@todo onmove')
		// Here, we must calculate the cabin movement according to the hardware
		// configuration
	}

})

// -- helpers (stateless) -----------------------------------------------------

/**
 * Returns the travel time for 1 storey at full speed, according to the
 * direction
 */
function storeyTravelDuration(direction, hardware) {
	if (direction === constants.direction.UP) return 1000
	else return 1200
	// @todo use hardware.cabinWeight, hardware.tractionForce, hardware.counterWeight
}


module.exports = CabinFSM
