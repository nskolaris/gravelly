import axios from 'axios'

export function createSegment (segment) {
	const data = {
		...segment,
		chunkyness: 1,
		waytype: '1'
	}
	return axios.post(`http://localhost:3000/segment`, data)
}

export function getSegments () {
	return axios.get(`http://localhost:3000/segments`)
}

export function getSegmentsByProximity (range, geom, lat, lng) {
	if (geom) return axios.get(`http://localhost:3000/segment_search?range=${range}&geom=${geom}`)
	return axios.get(`http://localhost:3000/segment_search?range=${range}&lat=${lat}&lng=${lng}`)
}
