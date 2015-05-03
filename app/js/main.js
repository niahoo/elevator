

var graphics = require('graphics')
var elevator = require('elevator')
var Storey = require('model/Storey')
var CONF = require('conf')

console.log('WontRepair initializing')

window.WontRepair = function(node) {
	// initialize
	var storeys = [new Storey(0), new Storey(1), new Storey(2)]
	var elv = elevator.createElevator()
	// var renderer = graphics.createRenderer({
	//	domnode:node,
	//	elevator:elv,
	//	storeys: storeys
	// })
	window.elv = elv // DEBUG
	setTimeout(function(){ elv.addWaypointUp(1) }, 1000)
}

console.log('WontRepair installed')


