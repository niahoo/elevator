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
	console.log('getElevatorY', index, amt)
	var y = getStoreyY(index, amt) + (CONF.storeyHeight - CONF.elevatorHeight)
	return y
}



function wrapStoreys (_storeys) {
	// @todo if reducing the amount of storeys, check if elevator is not
	// above the new max
	var data = _storeys.map(function(s){
		return {
			i: s.position,
			_storey: s,
			x: CONF.buildingX + CONF.buildingWallThickness,
			y: getStoreyY(s.position, _storeys.length),
			width: CONF.storeyWidth,
			height: CONF.storeyHeight,
		}
	})
	console.log('wrapped', data)
	return data
}

function createRenderer(opts) {
	console.log('createRenderer',opts)
	var elv = opts.elevator
	var initialProps = elv.getProps()
	var ractive = new Ractive({
		el: opts.domnode,
		template: appSVGTemplate,
		data: {
			storeys: wrapStoreys(opts.storeys),
			elv: { // elevator
				height: CONF.elevatorHeight,
				width: CONF.elevatorWidth,
				x: CONF.elevatorX,
				pos: initialProps.currentStorey,
				y: getElevatorY(initialProps.currentStorey, opts.storeys.length)
			}
		},
		storeysAmt: function() { return ractive.get('storeys').length },
		currentPos: function() { return ractive.get('elv.pos') },
	});

	// -- listen to elevator changes

	elv.on('*',function(){
		// console.log('elv emit',arguments)
		// console.log(' (state)', elv.state)
	})
	elv.on('transition',function(){
		// console.log('elv emit',arguments)
		console.log(' (state)', elv.state)
	})

	elv.on('moving', function(nextPostion, duration){
		var newY = getElevatorY(nextPostion, opts.storeys.length)
		return ractive.animate(
			{'elv.y': newY, 'elv.pos':nextPostion},
			{duration:duration,easing:'easeInOut'}
		)
	})

	return ractive
}

exports.createRenderer = createRenderer

