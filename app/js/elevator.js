var CabinFSM = require('cabinfsm')
var extend = require('extend')
var DestinationSelector = require('destination-selector')
var AsyncEmitter = require('async-emitter')

function ElevatorControl (building) {
	this.props = extend({},ElevatorControl.defaultProps)
	this.building = building
	this.emitter = new AsyncEmitter()
	console.error('@todo pick a (random?) floor, set our currentFloor to it and send a goto event to the cabin to force it there')
	// this.props.currentFloor = 0 // already in default props
	console.error('@todo listen to cabin events and change currentFloor when the cabins reaches a floor')
	console.log('ElevatorControl this',this)
	this.setEmitterListeners()
	// we boot the cabin last as it starts emitting events immediately
	this.cabin = CabinFSM.spawn({},[this])
}

ElevatorControl.prototype.deleteWaypoint = function(index) {
	console.log('deleteWaypoint', index)
	delete this.props.waypointsUp[index]
	delete this.props.waypointsDown[index]
	delete this.props.waypointsCabin[index]
}

ElevatorControl.prototype.addWaypointUp = function(index) {
	console.log('addWaypointUp',index)
	this.props.waypointsUp[index] = true
	this.wakeupCabin()
}

ElevatorControl.prototype.addWaypointDown = function(index) {
	console.log('addWaypointDown',index)
	this.props.waypointsDown[index] = true
	this.wakeupCabin()
}

ElevatorControl.prototype.addWaypointCabin = function(index) {
	console.log('addWaypointCabin',index)
	this.props.waypointsCabin[index] = true
	this.wakeupCabin()
}

ElevatorControl.prototype.wakeupCabin = function(index) {
	var self = this
	console.log('waking up cabin')
	this.cabin.send('wakeup')
}

ElevatorControl.prototype.maybeGoToNextDestination = function() {
	// we pass all our current information to the selector. It must choose a
	// destination with a snapshot of the current state. All waypoints are
	// converted to integers
	var selector = DestinationSelector.buildSelector({
		waypointsUp: Object.keys(this.props.waypointsUp).map(Number),
		waypointsDown: Object.keys(this.props.waypointsDown).map(Number),
		waypointsCabin: Object.keys(this.props.waypointsCabin).map(Number),
		currentFloor: this.props.currentFloor,
		currentDirection: this.props.currentDirection
	})
	this.props.nextDestination = selector.getNext()
	// if we have a new destination, we will send a command to the cabin to go
	// at the altitude of the new floor
	console.log('nextDestination', this.props.nextDestination)
	if (this.props.nextDestination !== null) {
		// @todo define client API
		console.log('this.building.getStorey(this.props.nextDestination)',this.building.getStorey(this.props.nextDestination))
		console.log('this.building.getStorey(this.props.nextDestination).floorAltitude', this.building.getStorey(this.props.nextDestination).floorAltitude)
		this.sendCabinCommand('MOVE',{
			floorAltitude: this.building.getStorey(this.props.nextDestination).floorAltitude
		})
	}
}

ElevatorControl.prototype.sendCabinCommand = function(command,opts) {
	opts.command = command
	this.cabin.send(opts)
}

ElevatorControl.prototype.notify = function() {
	var debugArgs = ['sending constrol notification'].concat(Array.prototype.slice.call(arguments))
	console.log.apply(console,debugArgs)
	// the notification simply proxies all arguments to the emitter.
	return this.emitter.emit.apply(this.emitter, arguments)
}

ElevatorControl.prototype.notifyCabinIdle = function() {
	return this.notify('CABIN_IDLE')
}
ElevatorControl.prototype.notifyStartingMove = function(currentAltitude, goalAltitude, travelTime) {
	return this.notify('CABIN_STARTED_MOVE', currentAltitude, goalAltitude, travelTime)
}
ElevatorControl.prototype.notifyCabinAltitude = function(altitude) {
	return this.notify('CABIN_ALTITUDE', altitude)
}
ElevatorControl.prototype.notifyArrived = function() {
	return this.notify('CABIN_ARRIVED')
}
ElevatorControl.prototype.notifyCabinStopped = function(altitude) {
	return this.notify('CABIN_STOPPED', altitude)
}
ElevatorControl.prototype.notifyGatesOpening = function(duration) {
	return this.notify('CABIN_GATES_OPENING',duration)
}
ElevatorControl.prototype.notifyGatesOpen = function(duration) {
	return this.notify('CABIN_GATES_OPEN')
}

ElevatorControl.prototype.setEmitterListeners = function() {
	var self = this
	this.emitter.on('CABIN_IDLE', function() {
		// when the cabin is idle,
		self.maybeGoToNextDestination()
	})
	this.emitter.on('CABIN_ARRIVED', function(altitude) {
		// cabin stopped at a floor. it sure is our next destination since we
		// only send move commands once at a time
		self.props.currentFloor = self.props.nextDestination
		console.log('%ccurrent floor = %s','color:orange', self.props.currentFloor)
		self.props.nextDestination = null
		self.deleteWaypoint(self.props.currentFloor)
	})
}

ElevatorControl.direction = require('constants').direction

ElevatorControl.defaultProps = {
	currentDirection: ElevatorControl.direction.UP, // no matter at the beginning but it must be set
	currentFloor: null, // a floor position
	nextDestination: null, // a floor position too

	// WAYPOINTS. waypoints stores are sets, i.e we only consider the keys. Set
	// wp[2]to any value to stop at the floor which index is 2.
	// delete wp[2] when at the floor to clean the object keys. (clean the
	// three lists).
	// --
	// We handle two buttons at each floor : one to go down, one to go up
	waypointsUp: {}, // list of floors that upmoving people want to reach
	waypointsDown: {}, // … the opposite
	// when in the cabin, the selected floors are stored into waypoints,
	// because we do not know (IRL) which people pushed them ant where they want
	// to go. To implement undirected buttons at floors, make a call to add
	// calls there and ignore waypointsUp/Down
	waypointsCabin: {},

	// TIMING
	timer: undefined, // A timer used to have cancellable setTimeout

	// floorS
	floors: [], // a list of floor objects
}

module.exports = ElevatorControl
