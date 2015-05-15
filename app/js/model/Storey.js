
// The position is an ordered index in the lsit of all the storeys, helping the
// elevator destination algorithm find its way

function Storey(position, altitude) {
	this.position = position
	this.altitude = altitude
}

Storey.makeCollection = function(altitudes) {
	var pos = 0
	return altitudes.map(function(alt){
		return new Storey(pos++,alt)
	})
}

module.exports = Storey
