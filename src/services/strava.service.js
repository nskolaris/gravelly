import axios from 'axios'

const clientId = process.env.VUE_APP_STRAVA_CLIENT_ID
const clientSecret = process.env.VUE_APP_STRAVA_CLIENT_SECRET
const token = localStorage.token

export function getAuthUrl () {
  return 'https://www.strava.com/oauth/authorize?client_id=66062&redirect_uri=http://localhost:8080&response_type=code&scope=read_all,activity:read_all'
}

export function getToken (code) {
  return axios.post(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code`)
}

export function getAthlete () {
  return axios.get('https://www.strava.com/api/v3/athlete', { headers: { 'Authorization': `Bearer ${token}` } }).catch(error => {
    console.log(error)
    localStorage.token = ''
  })
}

export function getActivities (perPage, page) {
  return axios.get(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage || ''}&page=${page || ''}`, { headers: { 'Authorization': `Bearer ${token}` } })
}

export function getActivity (id) {
  return axios.get(`https://www.strava.com/api/v3/activities/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
}

export function getActivityStream (id) {
  return axios.get(`https://www.strava.com/api/v3/activities/${id}/streams?keys=latlng,altitude,time&key_by_type=true`, { headers: { 'Authorization': `Bearer ${token}` } })
}
