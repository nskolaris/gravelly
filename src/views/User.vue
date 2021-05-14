<template>
  <div class="user">
    <template v-if="user">
      <div class="user_data">
        {{ user.firstname }}
        <img :src="user.profile_medium"/>
      </div>
      <div class="content">
        <div class="activityList">
          <div class="activity" v-for="(activity, i) in activities" :key="i" @click="activityIndex = i" :class="{active: activityIndex === i}">
            {{ activity.name }}
          </div>
        </div>
        <GmapMap
          :center="mapCenter"
          :zoom="10"
          map-type-id="terrain"
        >
          <GmapPolyline v-if="croppedPath" v-bind:path.sync="croppedPath" v-bind:options="{ strokeColor:'#FF0000'}"></GmapPolyline>
          <GmapPolyline v-for="(gravel, i) in gravels" v-bind:path.sync="gravel.path" v-bind:options="{ strokeColor: gravelIndex === i ? '#0000FF' : '#FF00FF'}" :key="gravel.name"></GmapPolyline>
        </GmapMap>
        <div class="gravelList">
          <div class="path" v-for="(gravel, i) in gravels" :key="i" @click="gravelIndex = i" :class="{active: gravelIndex === i}">
            {{ gravel.name }}
          </div>
        </div>
      </div>
      <div v-if="activityIndex !== null" class="activityDetails">
        {{ activities[activityIndex].name }}
        <div class="rangeSlider">
          <input type="range" v-model="rangeSelector[0]" step="0.1" min="1" max="100" id="from">
          <input type="range" v-model="rangeSelector[1]" step="0.1" min="1" max="100" id="to">
        </div>
        <div class="saveGravel">
          <input v-model="newGravelName"/>
          <button @click="saveGravel()">Save as gravel</button>
        </div>
      </div>
    </template>
    <a v-else :href="getAuthUrl()">Authorize</a>
  </div>
</template>

<script>
import polyline from '@mapbox/polyline'

import { getAuthUrl, getToken, getAthlete, getActivities } from '@/services/strava.service'

export default {
  name: 'User',
  data () {
    return {
      token: null,
      user: null,
      mapCenter: {lat: 0, lng: 0},
      path: null,
      croppedPath: null,
      activities: [],
      activityIndex: null,
      rangeSelector: [0, 100],
      newGravelName: '',
      gravels: [],
      gravelIndex: null
    }
  },
  mounted () {
    if (this.$route.query.code) {
      getToken(this.$route.query.code).then(r => {
        localStorage.token = r.data.access_token
        this.token = r.data.access_token
      })
    } else if (localStorage.token) this.token = localStorage.token
    if (localStorage.gravels) this.gravels = JSON.parse(localStorage.gravels)
  },
  methods: {
    getAuthUrl () { return getAuthUrl() },
    saveGravel () {
      this.gravels.push({
        name: this.newGravelName,
        path: this.croppedPath,
        date: new Date().getDate()
      })
      this.newGravelName = ''
      localStorage.gravels = JSON.stringify(this.gravels)
    },
    calculateCenter (path) {
      const center = {lat: 0, lng: 0}
      path.forEach(p => {
        center.lat += p.lat
        center.lng += p.lng
      });
      center.lat /= path.length
      center.lng /= path.length
      return center
    }
  },
  watch: {
    token () {
      if (this.token !== null) {
        getAthlete(this.token).then(r => { this.user = r.data })
        getActivities(this.token).then(r => { this.activities = r.data; this.activityIndex = 0 })
      }
    },
    activityIndex () {
      const activity = this.activities[this.activityIndex]
      this.path = polyline.decode(activity.map.summary_polyline).map(p => { return {lat: p[0], lng: p[1]} })
      this.croppedPath = [...this.path]
      this.rangeSelector = [0, 100]
      // this.mapCenter = this.path[parseInt(this.path.length / 2, 10)]
      this.mapCenter = this.calculateCenter(this.path)
    },
    rangeSelector () {
      const startIndex = parseInt(this.rangeSelector[0] * this.path.length / 100, 10)
      const endIndex = parseInt(this.rangeSelector[1] * this.path.length / 100, 10)
      const croppedPath = [...this.path]
      croppedPath.length = endIndex
      croppedPath.splice(0, startIndex)
      this.croppedPath = croppedPath
    },
    gravelIndex () {
      const gravel = this.gravels[this.gravelIndex]
      // this.mapCenter = gravel.path[parseInt(gravel.path.length / 2, 10)]
      this.mapCenter = this.calculateCenter(gravel.path)
    }
  }
}
</script>

<style>
.user {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.user .user_data {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  justify-content: space-between;
}

.user .content {
  display: flex;
  min-height: 0
}

.activityList {
  width: 20%;
  max-width: 250px;
  overflow-y: auto;
}
.activityList .activity {
  cursor: pointer;
  padding: 10px 15px;
}
.activityList .activity.active {
  background-color: #ffa60036;
}

.user .vue-map-container {
  flex: 1;
}

.gravelList {
  width: 20%;
  max-width: 250px;
  overflow-y: auto;
}
.gravelList .path {
  cursor: pointer;
  padding: 10px 15px;
}
.gravelList .path.active {
  background-color: #ffa60036;
}

.activityDetails {
  display: flex;
  padding: 15px;
  align-items: center;
  justify-content: space-between;
}

.rangeSlider {
  flex: 1;
  display: flex;
  justify-content: space-around;
}
.rangeSlider input {
  width: 40%;
}
</style>