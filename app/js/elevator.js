var CabinFSM = require('cabinfsm')
var extend = require('extend')
var DestinationSelector = require('destination-selector')
var AsyncEmitter = require('async-emitter')

function ElevatorControl (building) {
	this.cabin = CabinFSM.spawn({},[this])
	this.props = extend({},ElevatorControl.defaultProps)
	this.building = building
	this.emitter = new AsyncEmitter()
	console.error('@todo pick a (random?) floor, set our currentFloor to it and send a goto event to the cabin to force it there')
	// this.props.currentFloor = 0 // already in default props
	console.error('@todo listen to cabin events and change currentFloor when the cabins reaches a floor')
	console.log('ElevatorControl this',this)
	this.setEmitterListeners()
	// once everything is alright we can tell the cabin to start listening for
	// commands
	this.wakeupCabin()
}

ElevatorControl.prototype.deleteWaypoint = function(index) {
	console.log('deleteWaypoint', index)
	delete this.props.waypoints[index]
	delete this.props.waypointsUp[index]
	delete this.props.waypointsDown[index]
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
	var nextDestination = selector.getNext()
	// if we have a new destination, we will send a command to the cabin to go
	// at the altitude of the new floor
	console.log('nextDestination', nextDestination)
	if (nextDestination !== null) {
		// @todo define client API
		this.cabin.send({command:'MOVE', })
	}
}

ElevatorControl.prototype.notify = function() {
	var debugArgs = ['sending constrol notification'].concat(Array.prototype.slice.call(arguments))
	console.log.apply(console,debugArgs)
	// the notification simply proxies all arguments to the emitter.
	console.log('notify this',this)
	console.log('notify this',this)
	return this.emitter.emit.apply(this.emitter, arguments)
}

ElevatorControl.prototype.notifyCabinIdle = function() {
	return this.notify('CABIN_IDLE')
}

ElevatorControl.prototype.setEmitterListeners = function() {
	var self = this
	this.emitter.on('CABIN_IDLE', function() {
		// when the cabin is idle,
		self.maybeGoToNextDestination()
	})
}

ElevatorControl.direction = require('constants').direction

ElevatorControl.defaultProps = {
	currentDirection: ElevatorControl.direction.UP, // no matter at the beginning but it must be set
	currentFloor: 0,

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
