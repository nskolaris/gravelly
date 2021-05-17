<template>
  <div class="user">
    <div class="user_data">
      <template v-if="user">
        {{ user.firstname }}
        <img :src="user.profile_medium"/>
      </template>
      <a v-else :href="getAuthUrl()">Authorize</a>
    </div>
    <div class="content">
      <div class="routeList activities toggled" :class="{loading: activities.length === 0}">
        <div class="route" v-for="ac in activities" :key="ac.id" @click="selectActivity(ac)" :class="{active: activity && activity.id === ac.id, loading: loadingActivityId === ac.id}">
          {{ ac.name }}
        </div>
      </div>
      <l-map ref="leafmap" :center="mapCenter" :zoom="10">
        <l-tile-layer :url="'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"></l-tile-layer>
        <l-polyline v-if="activity" :lat-lngs="activity.simplePath" color="#FF0000" @click="selectActivity(activity)"></l-polyline>
        <l-polyline v-if="newGravel.path" :lat-lngs="newGravel.path" color="#0000FF"></l-polyline>
        <l-polyline v-for="gr in gravels" :lat-lngs="gr.path" :color="gravel && gravel.id === gr.id ? '#0000FF' : '#FF00FF'" :key="gr.id" @click="selectGravel(gr.id)"></l-polyline>
        <l-circle-marker v-if="timelineHover" :lat-lng="timelinePoint2LatLng(timelineHover, activity.path)" :radius="5" color="#FF0000"/>
      </l-map>
      <div class="routeList gravels toggled">
        <div class="route" v-for="gr in gravels" :key="gr.id" @click="selectGravel(gr.id)" :class="{active: gravel && gravel.id === gr.id}">
          {{ gr.name }}
        </div>
      </div>
    </div>
    <div v-if="activity" class="activity">
      <div class="activityDetails">
        <div class="date">{{ activity.startDate }}</div>
        <div class="name">{{ activity.name }}</div>
      </div>
      <div class="timeline" ref="timelineContainer">
        <canvas id="timeline" @mousemove="timelineMove" @mousedown="timelineDown" @mouseup="timelineUp" @mouseout="timelineOut" height="75"/>
      </div>
      <div class="saveGravel">
        <input v-model="newGravel.name" :disabled="!newGravel.path" placeholder="Name"/>
        <input v-model="newGravel.description" :disabled="!newGravel.path" placeholder="Description"/>
        <button @click="saveGravel()" :disabled="!newGravel.name || newGravel.name === ''">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import polyline from '@mapbox/polyline'
import moment from 'moment'

import { getAuthUrl, getToken, getAthlete, getActivities, getActivityStream } from '@/services/strava.service'
import { createSegment, getSegments } from '@/services/api.service'

export default {
  name: 'User',
  computed: {
    token: {
      get () { return localStorage.token },
      set (token) { localStorage.token = token }
    },
  },
  data () {
    return {
      user: null,
      mapCenter: {lat: 0, lng: 0},
      activities: [],
      loadingActivityId: null,
      activity: null,
      activityTimeline: null,
      gravels: [],
      gravel: null,
      newGravel: {},
      //Timeline vars
      timelineHover: null,
      timelineStart: null,
      timelineEnd: null,
      timelineSelecting: false
    }
  },
  mounted () {
    this.getInitialData()
    if (this.$route.query.code) getToken(this.$route.query.code).then(r => { this.token = r.data.access_token; this.$router.push('/'); this.$router.go() })
    else if (this.token) this.getStravaData()
  },
  updated () {
    if (this.activity && !this.activityTimeline) {
      this.activityTimeline = document.getElementById("timeline")
      if (this.activityTimeline && this.$refs.timelineContainer) {
        this.activityTimeline.width = this.$refs.timelineContainer.clientWidth;
        this.drawTimeline()
      }
    }
  },
  methods: {
    getAuthUrl () { return getAuthUrl() },
    getInitialData () {
      getSegments().then(r => {
        this.gravels = r.data.map(g => {
          g.path = polyline.decode(g.route).map(p => { return {lat: p[0], lng: p[1]} })
          return g
        })
      })
    },
    getStravaData ()  {
      getAthlete().then(r => { this.user = r.data })
      getActivities().then(r => {
        this.activities = r.data;
        if (this.activities.length > 0) this.selectActivity(this.activities[0])
      })
    },
    selectActivity (act) {
      if (!this.activity || this.activity.id !== act.id) {
        this.activity = act
        this.activity.simplePath = polyline.decode(this.activity.map.summary_polyline).map(p => { return {lat: p[0], lng: p[1]} })
        this.activity.startDate = moment(this.activity.start_date_local).format('YYYY-MM-DD HH:mm')
        delete this.newGravel.path
        this.resetTimeline()
        this.loadingActivityId = act.id
        getActivityStream(act.id).then(streams => {
          this.activity.path = streams.data.latlng.data.map(p => { return {lat: p[0], lng: p[1]} })
          this.activity.altitude = streams.data.altitude.data
          this.loadingActivityId = false
          this.drawTimeline()
        })
      }
      this.centerAndZoomPath(this.activity.simplePath)
    },
    selectGravel (id) {
      if (!this.gravel || this.gravel.id !== id) {
        this.gravel = this.gravels.find(g => g.id === id)
      }
      this.centerAndZoomPath(this.gravel.path)
    },
    saveGravel () {
      const newGravels = this.gravels
      newGravels.push({...this.newGravel})
      createSegment({
        name: this.newGravel.name,
        description: this.newGravel.description || '',
        route: polyline.encode(this.newGravel.path.map(p => [p.lat, p.lng]))
      })
      this.gravels = newGravels
      this.newGravel = {}
    },
    centerAndZoomPath (path) {
      const center = {lat: 0, lng: 0}
      const corner1 = []
      const corner2 = []
      path.forEach(p => {
        center.lat += p.lat
        center.lng += p.lng
        if (!corner1[0] || corner1[0] > p.lat) corner1[0] = p.lat
        if (!corner2[0] || corner2[0] < p.lat) corner2[0] = p.lat
        if (!corner1[1] || corner1[1] > p.lng) corner1[1] = p.lng
        if (!corner2[1] || corner2[1] < p.lng) corner2[1] = p.lng
      });
      center.lat /= path.length
      center.lng /= path.length
      this.mapCenter = center
      this.$refs.leafmap.mapObject.fitBounds([corner1, corner2], { padding: [30, 30] });
    },
    // Timeline fns
    drawTimeline () {
      if (this.activityTimeline) {
        const canvas = this.activityTimeline.getBoundingClientRect()
        var ctx = this.activityTimeline.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // TODO: Move to separate canvas
        if (this.activity.altitude) {
          ctx.beginPath()
          const elevation_diff = this.activity.elev_high - this.activity.elev_low
          this.activity.altitude.forEach((p, i) => {
            const x = (((i * 100) / this.activity.altitude.length) * canvas.width) / 100
            const y = (((((p - this.activity.elev_low) * 100) / elevation_diff) * canvas.height * 0.8) / 100) + canvas.height * 0.1
            if (i === 0) ctx.moveTo(x, canvas.height - y)
            else ctx.lineTo(x, canvas.height - y)
          })
          ctx.strokeStyle = "#fda400";
          ctx.stroke()
        }
        if (this.timelineHover) {
          ctx.beginPath()
          ctx.moveTo(this.timelineHover, 0)
          ctx.lineTo(this.timelineHover, canvas.height)
          ctx.stroke()
        }
        if (this.timelineStart) {
          ctx.beginPath();
          ctx.rect(this.timelineStart, 0, this.timelineEnd - this.timelineStart, canvas.height);
          ctx.fillStyle = "#ffa60036";
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
      this.centerAndZoomPath(this.newGravel.path)
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
      const startIndex = this.timelinePoint2PathIndex(Math.min(this.timelineStart, this.timelineEnd), this.activity.path)
      const endIndex = this.timelinePoint2PathIndex(Math.max(this.timelineStart, this.timelineEnd), this.activity.path)
      const croppedPath = [...this.activity.path]
      croppedPath.length = endIndex
      croppedPath.splice(0, startIndex)
      this.newGravel.path = croppedPath
    },
    resetTimeline () {
      this.timelineStart = null
      this.timelineEnd = null
      this.drawTimeline()
    }
  },
  watch: {
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
  color: var(--detail-color);
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
.user .user_data img {
  border-radius: 50%;
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
  background-color: var(--bg-color-2);
  transition: transform .5s, position 0s ease 5s;
  position: absolute;
  flex-shrink: 0;
}
.routeList.toggled {
  position: relative;
  transform: none;
}
.routeList .route {
  cursor: pointer;
  padding: 10px 15px;
  position: relative;
  border-radius: 50px;
}
.routeList .route.active {
  background-color: var(--highlight-color);
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

.activity {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.activity .activityDetails {
  padding: 10px 15px;
  flex-shrink: 0;
  width: 20%;
  max-width: 250px;
  box-sizing: border-box;
}
.activity .activityDetails .name {
  margin: 5px 0;
}
.activity .activityDetails .date {
  font-size: 10px;
  color: var(--text-color-2);
}
.activity .saveGravel {
  padding: 10px 15px;
  flex-shrink: 0;
  width: 20%;
  max-width: 250px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.activity .saveGravel input, .activity .saveGravel button {
  margin-top: 5px;
}
.activity .timeline {
  flex: 1;
  margin: 0 20px;
  box-sizing: border-box;
}
.activity .timeline canvas {
  vertical-align: middle;
  background-color: var(--bg-color-2);
}
</style>