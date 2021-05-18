import { getDirections } from '@/services/ors.service'

function getDist(x, y) {
    // pythag
    return ((x.lat - y.lat)**2 + (x.lng - y.lng)**2)**0.5
}


export function findClosestPoint(activity, route, isStart) {
    var point
    if (isStart) {
         point = route[0]
    } else {
         point = route[route.length-1]
    }
    var minDist = -1
    var minIdx = -1
    for (var i = 0; i < activity.length; i++) {
        var curr = activity[i]
        var currDist = getDist(curr, point)
        if (minIdx == -1) {
            minIdx = i
            minDist = currDist
        } else {
            if (currDist < minDist) {
                minIdx = i
                minDist = currDist
            }
        }
    }
    console.log(minIdx)
    return minIdx
}

export function spliceActivityToRoute(activity, route) {
	// get parts of route that are closest to the beginning and end of the activity
	var activitySplitStart = findClosestPoint(activity, route, true)
	var activitySplitEnd = findClosestPoint(activity, route, false)

	var startPoint = activity[activitySplitStart]
	var endPoint = activity[activitySplitEnd]

	var routeStart = route[0]
	var routeEnd = route[route.length-1]

	// get directions between the 2 end points and the activity
        var activityToRouteDirections = getDirections(startPoint.lng + ',' + startPoint.lat, routeStart.lng + ',' + routeStart.lat)
	var routeToActivityDirections = getDirections(routeEnd.lng + ',' + routeEnd.lat, endPoint.lng + ',' + endPoint.lat)


	var retPromise = new Promise((resolve) => {
		Promise.all([activityToRouteDirections, routeToActivityDirections]).then(vals => {
			
			var newRoute = activity.splice(0, activitySplitStart)
			newRoute = newRoute.concat(
				vals[0].data.features[0].geometry.coordinates.map(p => { return {lat: p[1], lng: p[0]} })
			)
			newRoute = newRoute.concat(route)
			newRoute = newRoute.concat(
				vals[1].data.features[0].geometry.coordinates.map(p => { return {lat: p[1], lng: p[0]} })
			)
			newRoute = newRoute.concat(activity.splice(endPoint, activity.length-1))
			resolve(newRoute)
		})
	})
	return retPromise

}

export async function addRoutesToActivity(activity, routes) {
	console.log(activity)
	console.log(routes)
	console.log(activity)
	for (var i = 0; i < routes.length; i++) {
		activity = await spliceActivityToRoute(activity, routes[i])
		console.log(activity)
	}
	return activity
}
