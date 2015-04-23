var Ractive = require('ractive')
var CONF = require('conf')
var appSVGTemplate = require('tpl/app.svg')

/**
* Returns a storey's bounding box. Svg vertical coordinates are descending
* @param  {0..} index   the storey's index
* @param  {1..} amt     the total number of storeys (= max index + 1)
 * @return {integer}       y coordinate
*/
function getStoreyY(index, amt) {
	var maxIndex = amt - 1
	var sa = maxIndex - index // count of storeys above
	var y = CONF.buildingWallThickness + (sa * CONF.storeyHeight) + (sa * CONF.storeySpacing)
	return y
}

/**
 * Get the elevator Y position when at a storey
 * @param  {integer} index The storey's index the elevator is at
 * @param  {integer} amt   The total number of storeys
 * @return {integer}       y coordinate
 */
function getElevatorY(index, amt) {
	var y = getStoreyY(index, amt) + (CONF.storeyHeight - CONF.elevatorHeight)
	return y
}



function wrapStoreys (_storeys) {
	// @todo if reducing the amount of storeys, check if elevator is not
	// above the new max
	var index = _storeys.length
	var storeys = []
	while (index--) {
		storeys[index] = {
			i:index,
			x: CONF.buildingX + CONF.buildingWallThickness,
			y: getStoreyY(index, _storeys.length),
			width: CONF.storeyWidth,
			height: CONF.storeyHeight,
		}
	}
	return storeys
}

function createRenderer(opts) {
	var elv = opts.elevator
	var initialProps = elv.getProps()
	var ractive = new Ractive({
		el: opts.domnode,
		template: appSVGTemplate,
		data: {
			storeys: wrapStoreys(initialProps.storeys),
			elv: { // elevator
				height: CONF.elevatorHeight,
				width: CONF.elevatorWidth,
				x: CONF.elevatorX,
				pos: initialProps.currentStorey,
				y: getElevatorY(initialProps.currentStorey, initialProps.storeys.length)
			}
		},
		setStoreys: function() {
			ractive.set('storeys', wrapStoreys(storeys))
		},
		changeElevatorPosition: function(storeyNewIndex) {
			var duration = calculateTravelDuration(ractive.currentPos(), storeyNewIndex)
			var newY = getElevatorY(storeyNewIndex, ractive.storeysAmt())
			// return the promise
			return ractive.animate(
				{'elv.y': newY, 'elv.pos':storeyNewIndex},
				{duration:duration,easing:'easeInOut'}
			)
		},
		storeysAmt: function() { return ractive.get('storeys').length },
		currentPos: function() { return ractive.get('elv.pos') },
	});
}

exports.createRenderer = createRenderer

