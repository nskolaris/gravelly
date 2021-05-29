import axios from 'axios'

export function createSegment (data) {
	return axios.post(`http://localhost:3000/segment`, data)
}

export function getSegments () {
	return axios.get(`http://localhost:3000/segments`)
}

export function getSegmentsByProximity (range, geom, lat, lng) {
	if (geom) return axios.get(`http://localhost:3000/segment_search?range=${range}&geom=${geom}`)
	return axios.get(`http://localhost:3000/segment_search?range=${range}&lat=${lat}&lng=${lng}`)
}
