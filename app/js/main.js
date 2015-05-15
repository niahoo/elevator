
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
			{ position:        0
			, floorAltitude:   0
			},
			{ position:        1
			, floorAltitude: 110
			},
			{ position:        2
			, floorAltitude: 220
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



