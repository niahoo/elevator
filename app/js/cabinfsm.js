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
	closedAwaitingTime: 500, // default time after doors close before set destination & move
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
			// then send a notification telling we're idle. We expect a command
			// message in return
			return this.flushAll('wakeup', function(){
				// no more wakeup message, we can loop on idle
				return this.next(this.idle)
			})
		})
		._(function(anyMessage){
			console.log('CabinFSM received unattended message : ', anyMessage)
			return this.next(this.idle)
		})
		.after(50000000, function(){
			// this is useless
			console.log('cabin idle timeout, sending notification again')
			return this.next(this.idle)
		})
	},

	onMove: function(moveCommand) {
		// check the altitude difference
		this.nextAltitude = moveCommand.floorAltitude
		var altDiff = this.nextAltitude - this.currentAltitude
		var travelTime
		var self = this
		if (altDiff !== 0) {
			// if the diff is positive, we are going up. negative -> down
			console.log('onMove moveCommand', moveCommand)
			console.log('onMove altDiff', altDiff)
			travelTime = storeyTravelDuration(altDiff, this.hardware)
			// Here, we must calculate the cabin movement according to the hardware
			// configuration
			console.log('onMove travelTime %sms', travelTime)
			var moveStartedAt  = new Date
			var moveFinishesAt = new Date
			moveFinishesAt.setTime(moveStartedAt.getTime() + travelTime)
			var intervalDuration = 200
			var pixelsPerInterval = altDiff / (travelTime / intervalDuration)
			console.log('pixelsPerInterval = %s / (%s / %s)', altDiff,travelTime,intervalDuration)
			console.log('moveStartedAt ',moveStartedAt.getTime())
			console.log('moveStartedAt ',moveStartedAt.getTime())
			console.log('moveFinishesAt',moveFinishesAt.getTime())
			console.log('pixelsPerInterval',pixelsPerInterval)

			this.control.notifyStartingMove(this.currentAltitude, this.nextAltitude, travelTime)
			// we set an interval that will notify the new altitutde every once in a
			// while
			this.movingInterval = setInterval(function() {
				self.currentAltitude = self.currentAltitude + pixelsPerInterval
				self.control.notifyCabinAltitude(self.currentAltitude)
			}, intervalDuration)
			// and a timeout that will continue the fsm execution after the
			// travel time to arrival handling. We also listen for emergency
			// stops
		} else {
			// no altitude moving, we go at the same floor we already are
			travelTime = 0
		}
		return this.receive('emergency_stop',function(){
			console.error('@todo emergency stopped')
			clearInterval(self.movingInterval)
		}).after(travelTime, function(){
			console.error('cabin arrived')
			clearInterval(self.movingInterval)
			// we arrived so we set our altitude to our goal altitude
			self.currentAltitude = self.nextAltitude
			self.nextAltitude = null
			return this.next(self.onArrival)
		})
	},

	onArrival: function() {
		this.control.notifyArrived()
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
		console.warn('@todo handle people')

		return this.receive('reopen', function(){
			console.log('asked to reopen')
			return this.next(this.onGatesOpen)
		})
		.after(this.openAwaitingTime, function(){
			return this.next(this.closingGates)
		})
	},

	closingGates: function() {
		console.log('gates closing')
		var now = new Date,
		    waitTime = this.hardware.doors.closingDuration + this.closedAwaitingTime

		return this.receive('reopen', function(){
			// if receiving reopen, we calculate the elapsed ratio of closing
			// time. We will be on reopening during the same ratio of opening.
			// But as we also wait for closedAwaitingTime before being idle, we
			// limit the elapsed time to the closing time (this is obvious)
			this.flushAll('reopen')
			var elapsed = Math.min(this.hardware.doors.closingDuration, (new Date).getTime() - now.getTime())
			var elapsedRatio = this.hardware.doors.closingDuration / elapsed
			var openingTime = this.hardware.doors.openingDuration / elapsedRatio
			console.log('elapsed', elapsed)
			console.log('elapsedRatio', elapsedRatio)
			console.log('openingTime', openingTime)
			this.control.notifyGatesOpening(openingTime)
			return this.next(this.onGatesOpen, openingTime)
		})
		.after(waitTime, function(){
			return this.next(this.idle)
		})
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
