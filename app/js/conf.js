
var conf = {
	storeyHeight: 100,
	storeyWidth: 200,
	storeySpacing: 12,
	initialStoreyCount: 3,
	initialElevatorPostion: 0, // it's a storey index
	buildingX: 20,
	buildingWallThickness: 5,
	svgHeight: 1000,
	svgWidth: 400,
	elevatorHeight:70,
	elevatorWidth:100,
	storeyElevatorSpacing:10 // horizontal spacing
}

conf.elevatorX = conf.buildingX + conf.buildingWallThickness + conf.storeyWidth + conf.storeyElevatorSpacing

module.exports = conf
