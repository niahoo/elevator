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
	openAwaitingTime: 300, 	 // default time with the doors left open
	closedAwaitingTime: 300, // default time after doors close before set destination & move
	doorsStates: doorsStates,
	doorsState: doorsStates.CLOSE,

	initialize: function() {
		console.log('CabinFSM initialize args', arguments)
		return this.next(this.loop)
	},

	loop: function(){
		console.log('looping !')
		return this.receiveAny(function(msg){
			console.log('received message : ',msg)
			return this.next(this.loop)
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
