
// fwrap  (state -> (state -> X) -> X)
function fwrap(state) {
	// fwrap monad transforms a state in a function accepting a transformer
	// definition (command/args), appliues the transformer to the state and
	// returns it. The transformer may return a new fwrap'ed states
	return function(command, arg1, arg2, arg3, arg4) {
		var args = Array.prototype.slice.call(arguments,1)
		// apply command/arguments to get a new function
		var fun = command.apply(null,args)
		return fun(state)
	}
}

var  l = console.log.bind(console)
var  ll = console.log.bind(console,' - list')

function select() {
	var sources = Array.prototype.slice.call(arguments)
	return function(list) {
		return fwrap(sources.reduce(function(acc,dict){
			return acc.concat(Object.keys(dict))
		},[]))
	}
}


function higherThanCurrent() {
	return function(list) {
		var cur = current()
		return fwrap(list.filter(function(item){
			return item > cur
		}))
	}
}

function lowest() {
	return function(list) {
		return fwrap(Math.min.apply(null,list))
	}
}

function call(callback) {
	return function(state) {
		return (callback(state))
	}
}

var go = true

var waypoints = {1:go,          4:go,          5:go,          7:go,          8:go}
var waypointsUp = {2:go,          4:go,          5:go,          6:go,          8:go}
var waypointsDown = {3:go,          4:go,          2:go,          8:go,          9:go}

function current() {
	return 5 // the current level
}

function id (x) { return x }

function main() {
	var f = fwrap([])
	var chained = f // ou f



	// This represents the user's program
	(select, waypoints, waypointsUp)  // select waypoints waypointsUp
	(higherThanCurrent)               // higherThanCurrent
	(lowest)                          // lowest
	// (call, function(x){ console.log('x',x); return x + 1})
	// -- end of input

	// extract the functor value
	(call, id)
	console.log('result ',chained)
}

main()
