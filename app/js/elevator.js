var CabinFSM = require('cabinfsm')
var extend = require('extend')

function ElevatorControl (storeys) {
	this.cabin = CabinFSM.spawn({},['theese','are the','init','args'])
	this.props = extend({},ElevatorControl.defaultProps)
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
	this.cabin.send('wakeup')
}

ElevatorControl.prototype.addWaypointDown = function(index) {
	console.log('addWaypointDown',index)
	this.props.waypointsDown[index] = true
	this.cabin.send('wakeup')
}

ElevatorControl.prototype.addWaypointCabin = function(index) {
	console.log('addWaypointCabin',index)
	this.props.waypointsCabin[index] = true
	this.cabin.send('wakeup')
}

ElevatorControl.direction = {UP: 'UP', DOWN: 'DOWN'}
ElevatorControl.direction = {UP: 'UP', DOWN: 'DOWN'}

ElevatorControl.defaultProps = {
	direction: ElevatorControl.direction.UP, // no matter at the beginning but it must be set
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
	waypointsCabin: {},

	// TIMING
	timer: undefined, // A timer used to have cancellable setTimeout


	// STOREYS
	storeys: [], // a list of storey objects
}


module.exports = ElevatorControl
