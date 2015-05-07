
var graphics = require('graphics')
var Elevator = require('elevator')
var Storey = require('model/Storey')
var CONF = require('conf')

console.log('WontRepair initializing')

window.WontRepair = function(node) {
	// initialize
	var storeys = [new Storey(0), new Storey(1), new Storey(2)]
	window.elv = new Elevator(storeys)
	// var renderer = graphics.createRenderer({
	//	domnode:node,
	//	elevator:elv,
	//	storeys: storeys
	// })
	console.log('elv',elv)// DEBUG
	setTimeout(function(){
		elv.addWaypointUp(1)
	}, 300)
}

console.log('WontRepair installed')



