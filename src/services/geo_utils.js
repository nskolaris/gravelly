import { getDirections } from '@/services/ors.service'

function getDist(x, y) {
    // pythag
    return ((x.lat - y.lat)**2 + (x.lng - y.lng)**2)**0.5
}


export function findClosestPoint(activity, route, isStart) {
    if (isStart) {
         var point = route[0]
    } else {
         var point = route[route.length-1]
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
    return minIdx
}

export function spliceActivityToRoute(activity, route) {
	// get parts of route that are closest to the beginning and end of the activity
	activitySplitStart = findClosestPoint(activity, route, true)
	activitySplitEnd = findClosestPoint(activity, route, false)

	startPoint = activity[activitySplitStart]
	endPoint = activity[activitySplitEnd]

	routeStart = route[0]
	routeEnd = route[route.length-1]

	// get directions between the 2 end points and the activity
        activityToRouteDirections = getDirections(startPoint.lng + ',' + startPoint.lat, routeStart.lng + ',' + routeStart.lat)
	routeToActivityDirections = getDirections(routeEnd.lng + ',' + routeEnd.lat, endPoint.lng + ',' + endPoint.lat)

	Promise.all([activityToRouteDirections, routeToActivityDirections]).then(vals => {
		newRoute = activity.splice(0, activitySplitStart).concat(vals[0].data.features[0].geometry.coordinates.map(p => { return {lat: p[1], lng: p[0]} }))

		newRoute = newRoute.concat(route).concat(
			vals[1].data.features[0].geometry.coordinates.map(p => { return {lat: p[1], lng: p[0]} })
		)
		newRoute = newRoute.concat(activity.splice(endPoint, activity.length-1))
		return newRoute
	})
}
