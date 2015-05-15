var constants = require('constants')


var FSM = require('fsm')

var defaultHardware = {
	cabinWeight: 200,
	tractionForce: 1,
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
	movingInterval: null,

	initialize: function(control) {
		console.log('CabinFSM initialize args', arguments)
		this.control = control // control is the elevator main controller
		// at the beginning, doors are close and the cabin is stopped, so we are
		// in an 'idle' state
		return this.next(this.idle)
	},

	idle: function() {
		// here, the doors are close. We can notify our controller that we are
		// ready to do some movement
		console.log('cabin entering idle')
		this.control.notifyCabinIdle()
		return this
		.receive({command:'MOVE'}, this.onMove)
		.receive('wakeup', function(message){
			// we received a wakeup notification, telling us that there is work
			// to do. we will flush all the others wakeup messages in queue and
			// then send a notification telling we're idle. So we will expect a
			// command message in return
			return (function flush(message) {
				console.log('flushing wakeups',message)
				return this.receive('wakeup', flush)
				.after(0, function(){
					// no more wakeup message, we can tell that we are idle
					// and move on
					return this.next(this.idle)
				})
			}).bind(this)()
		})
		._(function(anyMessage){
			console.log('CabinFSM received unattended message : ', anyMessage)
			return this.next(this.idle)
		})
		.after(5000, function(){
			// this is useless
			console.log('cabin idle timeout, sending notification again')
			return this.next(this.idle)
		})
	},

	onMove: function(moveCommand) {
		// check the altitude difference
		this.nextAltitude = moveCommand.floorAltitude
		var altDiff = this.nextAltitude - this.currentAltitude
		// if the diff is positive, we are going up. negative -> down
		console.log('onMove moveCommand', moveCommand)
		console.log('onMove altDiff', altDiff)
		var travelTime = storeyTravelDuration(altDiff, this.hardware)
		// Here, we must calculate the cabin movement according to the hardware
		// configuration
		console.log('onMove travelTime %sms', travelTime)
		var moveStartedAt  = new Date
		var moveFinishesAt = new Date
		moveFinishesAt.setTime(moveStartedAt.getTime() + travelTime)
		var intervalDuration = 200
		var pixelsPerInterval = altDiff / (travelTime / intervalDuration)
		console.log('moveStartedAt ',moveStartedAt.getTime())
		console.log('moveFinishesAt',moveFinishesAt.getTime())
		console.log('pixelsPerInterval',pixelsPerInterval)

		this.control.notifyStartingMove(this.currentAltitude, this.nextAltitude, travelTime)
		return this.async(function(next){
			// we set an interval that will notify the new altitutde every once in a
			// while
			var self = this
			this.movingInterval = setInterval(function() {
				self.currentAltitude = self.currentAltitude + pixelsPerInterval
				self.control.notifyCabinAltitude(self.currentAltitude)
			}, intervalDuration)
			// and a timeout that will continue the fsm execution after the
			// travel time to arrival handling
			setTimeout(function(){
				clearInterval(self.movingInterval)
				self.currentAltitude = self.nextAltitude
				self.nextAltitude = null
				next(self.onArrival)
			},travelTime)
		})
	},

	onArrival: function() {
		this.control.notifyCabinStopped(this.currentAltitude)
		this.control.notifyGatesOpening(this.hardware.doors.openingDuration)
		return this.next(this.onGatesOpen, this.hardware.doors.openingDuration)
	},

	onGatesOpen: function() {
		this.control.notifyGatesOpen()
		// gates are open. we could listen to messages such as "reopen gates"
		// from the people within the cabin, which, while not closing, still
		// resets the opening time

		// we must handle people's weight physically so in this FSM because it
		// handle physics
		console.error('@todo handle people')

		return this.receive('reopen', function(){
			console.log('asked to reopen')
			return this.next(this.onGatesOpen)
		})
		.after(this.openAwaitingTime, function(){
			return this.next(this.closingGates)
		})
	},

	closingGates: function() {
		console.error('@todo')
		// receive "reopen" here to. We should calculate from how much time
		// the gates were closing, and with a ratio estimate how much time
		// they'll take to be open again

		// the elevator should be still able to accept people into the cabin
	}

})

// -- helpers (stateless) -----------------------------------------------------

/**
 * Returns the travel time for some vertical movement. Dimensions are not
 * realworld, just pixels
 */
function storeyTravelDuration(verticalVector, hardware) {
	var directionMultiplier = verticalVector > 0
		? 1.2 // slower when going up
		: 0.9 // faster when going down
	var timeMultiplier = hardware.tractionForce * directionMultiplier
	// with a default traction force of 1 and going up = 1 * 1.2 = 1.2 this
	// gives a time in seconds, for an arbitrary vector of 100px that we convert
	// to milliseconds
	console.log('%s * %s / 100 * 1000', timeMultiplier, verticalVector)
	return (timeMultiplier * verticalVector / 100 * 1000) >> 0
	// @todo use hardware.cabinWeight, hardware.tractionForce, hardware.counterWeight
}


module.exports = CabinFSM
