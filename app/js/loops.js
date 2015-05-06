// var Promise = require('es6-promise').Promise
// var spawn = requestAnimationFrame
var spawn = setImmediate
// A simple function that calls next with a pre-defined state when called
var bindNext = function(next, newState) {
	return function() {
		return next(newState)
	}
}

function asyncState (callback, state) {
	(function next(newState) {
		spawn(function() { callback(newState, next) })
	}(state))
}

// simple counters functions. We do not use an abstraction but rather copy paste
// the algorythms for performance

// runs aync from [0 included -> max EXcluded
function asyncCount (max, preCallback) {
	var run = function(callback) {
		var callResolve
		var promise = new Promise(function(resolve, reject){
			callResolve = resolve
		})
		;(function next(i) {
			if (i < max) spawn(function() { callback(i, bindNext(next, i+1)) })
			else callResolve() // <-- promise will be empty
		}(0))
		return promise
	}
	if (preCallback) return run(preCallback)
	else return run
}

// runs aync from max INcluded -> 1 included
function asyncReverseCount (max, preCallback) {
	var run = function(callback) {
		var callResolve
		var promise = new Promise(function(resolve, reject){
			callResolve = resolve
		})
		;(function next(i) {
			if (i > 0) spawn(function() { callback(i, bindNext(next, i-1)) })
			else callResolve() // <-- promise will be empty
		}(max))
		return promise
	}
	if (preCallback) return run(preCallback)
	else return run
}

// just like async state ... with no state
function forever (callback) {
	(function next() {
		spawn(function() { callback(next) })
	}())
}

module.exports = {
	async: {
		state: asyncState,
		r: asyncReverseCount,
		n: asyncCount,
		forever: forever
	}
}
