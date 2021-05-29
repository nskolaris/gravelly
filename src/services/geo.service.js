import { getDirections } from '@/services/ors.service'

function getDist (x, y) {
	// pythag
	return (((x.lat - y.lat) ** 2) + ((x.lng - y.lng) ** 2)) ** 0.5
}


export function findClosestPoint (activity, route, isStart) {
	let point
	if (isStart) {
		[point] = route
	} else {
		point = route[route.length - 1]
	}
	let minDist = -1
	let minIdx = -1
	for (let i = 0; i < activity.length; i++) {
		const curr = activity[i]
		const currDist = getDist(curr, point)
		if (minIdx === -1) {
			minIdx = i
			minDist = currDist
		} else if (currDist < minDist) {
			minIdx = i
			minDist = currDist
		}
	}
	console.log(minIdx)
	return minIdx
}

export function spliceActivityToRoute (activity, route) {
	// get parts of route that are closest to the beginning and end of the activity
	const activitySplitStart = findClosestPoint(activity, route, true)
	const activitySplitEnd = findClosestPoint(activity, route, false)

	const startPoint = activity[activitySplitStart]
	const endPoint = activity[activitySplitEnd]

	const routeStart = route[0]
	const routeEnd = route[route.length - 1]

	// get directions between the 2 end points and the activity
	const activityToRouteDirections = getDirections(`${startPoint.lng},${startPoint.lat}`, `${routeStart.lng},${routeStart.lat}`)
	const routeToActivityDirections = getDirections(`${routeEnd.lng},${routeEnd.lat}`, `${endPoint.lng},${endPoint.lat}`)


	const retPromise = new Promise(resolve => {
		Promise.all([activityToRouteDirections, routeToActivityDirections]).then(vals => {
			let newRoute = activity.slice(0, activitySplitStart)
			newRoute = newRoute.concat(
				vals[0].data.features[0].geometry.coordinates.map(p => ({ lat: p[1], lng: p[0] }))
			)
			newRoute = newRoute.concat(route)
			newRoute = newRoute.concat(
				vals[1].data.features[0].geometry.coordinates.map(p => ({ lat: p[1], lng: p[0] }))
			)
			newRoute = newRoute.concat(activity.slice(activitySplitEnd, activity.length))
			resolve(newRoute)
		})
	})
	return retPromise
}

export async function addRoutesToActivity (activity, routes) {
	console.log(activity)
	console.log(routes)
	console.log(activity)
	for (let i = 0; i < routes.length; i++) {
		activity = await spliceActivityToRoute(activity, routes[i])
		console.log(activity)
	}
	return activity
}
