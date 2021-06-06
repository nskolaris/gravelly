import axios from 'axios'

const apiUrl = process.env.apiUrl

export function createSegment (data) {
	return axios.post(`${apiUrl}/segment`, data)
}

export function getSegments () {
	return axios.get(`${apiUrl}/segments`)
}

export function getSegmentsByProximity (range, geom, lat, lng) {
	if (geom) return axios.get(`${apiUrl}/segment_search?range=${range}&geom=${geom}`)
	return axios.get(`${apiUrl}/segment_search?range=${range}&lat=${lat}&lng=${lng}`)
}
