import axios from 'axios'

const clientId = process.env.VUE_APP_STRAVA_CLIENT_ID
const clientSecret = process.env.VUE_APP_STRAVA_CLIENT_SECRET

export function getToken (code) {
  function gotToken (response) {
    localStorage.token = response.data.access_token
    localStorage.refreshToken = response.data.refresh_token
  }
  if (code) {
    return axios.post(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code`).then(gotToken)
  } else if (localStorage.refreshToken) {
    return axios.post(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${localStorage.refreshToken}&grant_type=refresh_token`).then(gotToken)
  }
}

function get (url) {
  return new Promise((resolve) => {
    axios.get(url, { headers: { 'Authorization': `Bearer ${localStorage.token}` } })
    .catch((e) => {
      if (e.response.status === 401) getToken().then(() => { 
        get(url).then(r => { resolve(r) })
      })
      else console.log(e.response)
    }).then(r => { if (r) resolve(r) })
  });
}

export function getAuthUrl () {
  return 'https://www.strava.com/oauth/authorize?client_id=66062&redirect_uri=http://localhost:8080&response_type=code&scope=read_all,activity:read_all'
}

export function getAthlete () {
  return get('https://www.strava.com/api/v3/athlete')
}

export function getActivities (perPage, page) {
  return get(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage || ''}&page=${page || ''}`)
}

export function getActivity (id) {
  return get(`https://www.strava.com/api/v3/activities/${id}`)
}

export function getActivityStream (id) {
  return get(`https://www.strava.com/api/v3/activities/${id}/streams?keys=latlng,altitude,time&key_by_type=true`)
}
