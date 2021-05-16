<template>
  <div class="user">
    <template v-if="user">
      <div class="user_data">
        {{ user.firstname }}
        <img :src="user.profile_medium"/>
      </div>
      <div class="content">
        <div class="routeList activities toggled">
          <div class="route" v-for="(ac, i) in activities" :key="i" @click="selectActivity(ac.id)" :class="{active: (loadingActivityId || activity.id) === ac.id, loading: loadingActivityId === ac.id}">
            {{ ac.name }}
          </div>
        </div>
        <!-- <GmapMap :center="mapCenter" :zoom="10" map-type-id="terrain">
          <GmapPolyline v-if="croppedPath" v-bind:path.sync="croppedPath" v-bind:options="{ strokeColor:'#FF0000'}"></GmapPolyline>
          <GmapPolyline v-for="(gravel, i) in gravels" v-bind:path.sync="gravel.path" v-bind:options="{ strokeColor: gravelIndex === i ? '#0000FF' : '#FF00FF'}" :key="gravel.name"></GmapPolyline>
        </GmapMap> -->
        <l-map :center="mapCenter" :zoom="10">
          <l-tile-layer :url="'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"></l-tile-layer>
          <l-polyline v-if="croppedPath" :lat-lngs="croppedPath" color="#FF0000"></l-polyline>
          <l-polyline v-for="(gravel, i) in gravels" :lat-lngs="gravel.path" :color="gravelIndex === i ? '#0000FF' : '#FF00FF'" :key="gravel.name"></l-polyline>
        </l-map>
        <div class="routeList gravels toggled">
          <div class="route" v-for="(gravel, i) in gravels" :key="i" @click="gravelIndex = i" :class="{active: gravelIndex === i}">
            {{ gravel.name }}
          </div>
        </div>
      </div>
      <div v-if="activity" class="activityDetails">
        {{ activity.name }}
        <div class="rangeSlider">
          <input type="range" v-model="rangeSelector[0]" step="0.1" min="1" max="100" id="from">
          <input type="range" v-model="rangeSelector[1]" step="0.1" min="1" max="100" id="to">
        </div>
        <div class="saveGravel">
          <input v-model="newGravelName"/>
          <button @click="saveGravel()">Save as gravel</button>
        </div>
        <div class="laps">
          laps
        </div>
      </div>
    </template>
    <a v-else :href="getAuthUrl()">Authorize</a>
  </div>
</template>

<script>
import polyline from '@mapbox/polyline'

import { getAuthUrl, getToken, getAthlete, getActivities, getActivity } from '@/services/strava.service'

export default {
  name: 'User',
  computed: {
    token: {
      get () { return localStorage.token },
      set (token) { localStorage.token = token }
    },
    gravels: {
      get () {
        let gravels = []
        if (localStorage.gravels) gravels = JSON.parse(localStorage.gravels)
        if (typeof gravels !== 'object') gravels = []
        return gravels
      },
      set (gravels) { localStorage.gravels = JSON.stringify(gravels); console.log(localStorage.gravels) }
    }
  },
  data () {
    return {
      user: null,
      mapCenter: {lat: 0, lng: 0},
      path: null,
      croppedPath: null,
      activities: [],
      activity: null,
      loadingActivityId: null,
      rangeSelector: [0, 100],
      newGravelName: '',
      gravelIndex: null
    }
  },
  mounted () {
    if (this.$route.query.code) getToken(this.$route.query.code).then(r => { this.token = r.data.access_token; this.$router.push('/'); this.$router.go() })
    else if (this.token) this.getInitialData()
  },
  methods: {
    getAuthUrl () { return getAuthUrl() },
    getInitialData ()  {
      getAthlete().then(r => { this.user = r.data })
      getActivities().then(r => { this.activities = r.data; this.selectActivity(this.activities[0].id) })
    },
    selectActivity (id) {
      this.loadingActivityId = id;
      getActivity(id).then(r => {
        this.activity = r.data
        this.loadingActivityId = null
        this.path = polyline.decode(this.activity.map.summary_polyline).map(p => { return {lat: p[0], lng: p[1]} })
        this.croppedPath = [...this.path]
        this.rangeSelector = [0, 100]
        this.mapCenter = this.calculateCenter(this.path)
      })
    },
    saveGravel () {
      const newGravels = this.gravels
      newGravels.push({
        name: this.newGravelName || new Date().toString(),
        path: this.croppedPath,
        date: new Date().toString()
      })
      this.gravels = newGravels
      this.newGravelName = ''
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
      this.mapCenter = this.calculateCenter(gravel.path)
    }
  }
}
</script>

<style>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.user .user_data {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  justify-content: space-between;
}

.user .content {
  display: flex;
  min-height: 0;
  flex: 1;
}

.routeList {
  width: 20%;
  max-width: 250px;
  height: 100%;
  overflow-y: auto;
  background-color: white;
  transition: transform .5s, position 0s ease 5s;
  position: absolute;
}
.routeList.toggled {
  position: relative;
  transform: none;
}
.routeList .route {
  cursor: pointer;
  padding: 10px 15px;
  position: relative;
}
.routeList .route.active {
  background-color: #ffa60036;
}
.routeList .route.loading:after {
  content: "\27F3";
  color: orange;
  font-size: 20px;
  animation: 1s linear infinite spin;
  position: absolute;
  right: 15px;
  top: 0;
  bottom: 0;
}
.activities {
  left: 0;
  transform: translateX(-100%);
}
.gravels {
  right: 0;
  transform: translateX(100%);
}

.user .vue-map-container {
  flex: 1;
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