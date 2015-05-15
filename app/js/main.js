
var graphics = require('graphics')
var Elevator = require('elevator')
var Storey = require('model/Storey')
var Building = require('model/Building')
var CONF = require('conf')

console.log('WontRepair initializing')

window.WontRepair = function(node) {
	// create storeys from their altitude
	var building = new Building({
		storeys: [
			{ id:    0
			, floor: 0 //
			},
			{ id:    1
			, floor: 110 //
			},
			{ id:    2
			, floor: 220 //
			}
		]
	})
	window.elv = new Elevator(building)
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



