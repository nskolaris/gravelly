import axios from 'axios'

export function createSegment (data) {
  return axios.post(`http://localhost:3000/segment`, data)
}

export function getSegments () {
  return axios.get(`http://localhost:3000/segments`)
}