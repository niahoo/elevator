
// The position is an ordered index in the lsit of all the storeys, helping the
// elevator destination algorithm find its way

function Storey(position, altitude) {
	this.position = position
	this.altitude = altitude
}

module.exports = Storey
