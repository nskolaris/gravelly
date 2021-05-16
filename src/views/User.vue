<template>
  <div class="user">
    <template v-if="user">
      <div class="user_data">
        {{ user.firstname }}
        <img :src="user.profile_medium"/>
      </div>
      <div class="content">
        <div class="routeList activities toggled" :class="{loading: activities.length === 0}">
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
          <l-polyline v-if="path" :lat-lngs="path" color="#FF0000"></l-polyline>
          <l-polyline v-if="croppedPath" :lat-lngs="croppedPath" color="#0000FF"></l-polyline>
          <l-polyline v-for="(gravel, i) in gravels" :lat-lngs="gravel.path" :color="gravelIndex === i ? '#0000FF' : '#FF00FF'" :key="gravel.name"></l-polyline>
          <l-circle-marker v-if="timelineHover" :lat-lng="timelinePoint2LatLng(timelineHover, path)" :radius="5" color="#FF0000"/>
        </l-map>
        <div class="routeList gravels toggled">
          <div class="route" v-for="(gravel, i) in gravels" :key="i" @click="gravelIndex = i" :class="{active: gravelIndex === i}">
            {{ gravel.name }}
          </div>
        </div>
      </div>
      <div v-if="activity" class="activityDetails">
        {{ activity.name }}
        <div class="timeline" ref="timelineContainer">
          <canvas id="timeline" @mousemove="timelineMove" @mousedown="timelineDown" @mouseup="timelineUp" @mouseout="timelineOut" height="0"/>
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
      set (gravels) { localStorage.gravels = JSON.stringify(gravels) }
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
      activityTimeline: null,
      timelineHover: null,
      timelineStart: null,
      timelineEnd: null,
      timelineSelecting: false,
      loadingActivityId: null,
      newGravelName: '',
      gravelIndex: null
    }
  },
  mounted () {
    if (this.$route.query.code) getToken(this.$route.query.code).then(r => { this.token = r.data.access_token; this.$router.push('/'); this.$router.go() })
    else if (this.token) this.getInitialData()
  },
  updated () {
    if (this.activity && !this.activityTimeline) {
      this.activityTimeline = document.getElementById("timeline")
      if (this.activityTimeline && this.$refs.timelineContainer) {
        this.activityTimeline.width = this.$refs.timelineContainer.clientWidth;
        this.activityTimeline.height = this.$refs.timelineContainer.clientHeight;
        this.drawTimeline()
      }
    }
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
    },
    drawTimeline () {
      if (this.activityTimeline) {
        const canvas = this.activityTimeline.getBoundingClientRect()
        var ctx = this.activityTimeline.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (this.timelineHover) {
          ctx.beginPath()
          ctx.moveTo(this.timelineHover, 0)
          ctx.lineTo(this.timelineHover, canvas.height)
          ctx.stroke()
        }
        if (this.timelineStart) {
          ctx.beginPath();
          ctx.rect(this.timelineStart, 0, this.timelineEnd - this.timelineStart, canvas.height);
          ctx.fillStyle = "#0000FFAA";
          ctx.fill()
        }
      }
    },
    timelineMove (e) {
      const canvas = this.activityTimeline.getBoundingClientRect()
      this.timelineHover = e.clientX - canvas.left
      if (this.timelineSelecting) {
        this.timelineEnd = e.clientX - canvas.left
        this.timelineCropPath()
      }
    },
    timelineDown (e) {
      const canvas = this.activityTimeline.getBoundingClientRect()
      this.timelineSelecting = true
      this.timelineStart = e.clientX - canvas.left
    },
    timelineUp (e) {
      const canvas = this.activityTimeline.getBoundingClientRect()
      this.timelineSelecting = false
      this.timelineEnd = e.clientX - canvas.left
      this.timelineCropPath()
    },
    timelineOut () {
      this.timelineHover = null
    },
    timelinePoint2PathIndex (point, path) {
      const canvas = this.activityTimeline.getBoundingClientRect()
      const pointPerc = point * 100 / canvas.width
      return Math.round(pointPerc * (path.length - 1) / 100)
    },
    timelinePoint2LatLng (point, path) {
      return path[this.timelinePoint2PathIndex(point, path)]
    },
    timelineCropPath () {
      const startIndex = this.timelinePoint2PathIndex(Math.min(this.timelineStart, this.timelineEnd), this.path)
      const endIndex = this.timelinePoint2PathIndex(Math.max(this.timelineStart, this.timelineEnd), this.path)
      const croppedPath = [...this.path]
      croppedPath.length = endIndex
      croppedPath.splice(0, startIndex)
      this.croppedPath = croppedPath
    }
  },
  watch: {
    gravelIndex () {
      const gravel = this.gravels[this.gravelIndex]
      this.mapCenter = this.calculateCenter(gravel.path)
    },
    timelineHover () {
      this.drawTimeline()
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

.loading:after {
  content: "\27F3";
  color: orange;
  animation: 1s linear infinite spin;
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
.routeList.loading:after {

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
  font-size: 20px;
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

.timeline {
  flex: 1;
  margin: 0 20px;
}
.timeline canvas {
  vertical-align: middle;
  border: 1px solid gray;
}
</style>