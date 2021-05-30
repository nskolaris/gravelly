import axios from 'axios'

const apiKey = process.env.orsApiKey

export function getDirections (start, end, profile) {
	profile = profile || 'cycling-mountain'
	return axios.get(`https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}`)
}
