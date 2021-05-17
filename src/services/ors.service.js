import axios from 'axios'

const apiKey = process.env.VUE_APP_ORS_API_KEY

export function getDirections (start, end, profile) {
  profile = profile || 'cycling-mountain'
  return axios.get(`https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}`)
}
