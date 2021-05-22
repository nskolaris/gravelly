<template>
  <div class="main">
    <div class="head">
      <h1>Gravelly</h1>
      <div v-if="user" class="user_data">
        {{ user.firstname }}
        <img :src="user.profile_medium"/>
      </div>
    </div>
    <div class="content">

      <div class="routeList activities toggled">
        <template v-if="stravaAuthenticated">
          <div class="head">
            <h1>Your Activities</h1>
            <div class="importActivity" @click="() => { $refs.importActivity.click() }">&#8657;</div>
            <input style="display: none;" ref="importActivity" accept=".gpx" type="file" @change="importActivity">
          </div>
          <div class="scrollContainer" @scroll="scrollActivities" :class="{loading: loadingActivities}">
            <div class="route" v-for="ac in activities" :key="ac.id" @click="selectActivity(ac)" :class="{active: activity && activity.id === ac.id}">
              <div class="name">
                {{ ac.name }}
                <span v-if="ac.id === 'uploaded'" class="description">Uploaded</span>
              </div>
              <div class="details">
                <template v-if="ac.start_date">{{ moment(ac.start_date).format('MMM DD') }}<br/></template>
                {{ (ac.distance / 1000).toFixed(0) }} km
              </div>
            </div>
          </div>
        </template>
        <div class="connectStrava" v-else>
          <a :href="getAuthUrl()">Connect with Strava</a> to create gravel segments from your activities
        </div>
      </div>

      <l-map ref="leafmap" :center="mapCenter" :zoom="mapZoom" @click="clickMap">
        <l-tile-layer :url="'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"></l-tile-layer>
        <!-- Segment search area -->
        <l-circle v-if="currentPosition" :lat-lng="currentPosition" :radius="segmentSearchRange" :color="seachAreaColor" :fill="false"/>
        <!-- Activity -->
        <l-polyline v-if="activity" :lat-lngs="activity.simplePath" :color="activityColor" @click="selectActivity(activity)"></l-polyline>
         <!-- Segments -->
        <l-polyline v-for="gr in gravels" :lat-lngs="gr.path" :color="segmentColor" :key="gr.id" @click="(e) => { !newRoute ? selectGravel(gr.id) : addGravelToRoute(gr.id, e) }"></l-polyline>
        <!-- Route -->
        <template v-if="newRoute">
          <l-polyline :lat-lngs="routeArrayToPath(newRoute)" :color="routeColor"></l-polyline>
          <l-circle-marker
            v-for="(routePoint, i) in newRoute.filter(p => p.lat !== undefined)"
            :lat-lng="routePoint"
            :radius="5"
            :color="i === 0 ? routeStartColor : i === newRoute.filter(p => p.lat !== undefined).length - 1 ? routeFinishColor : routeColor"
            :key="'route-' + i"
          />
        </template>
        <!-- Current location -->
        <l-circle-marker v-if="currentPosition" :lat-lng="currentPosition" :radius="5" :color="currentLocationColor"/>
        <!-- Timeline selection -->
        <l-polyline v-if="timelineStart || pathSelectionStartEndIndex" :lat-lngs="getSelectingPath(activity.path) || getSelectedPath(activity.path)" :color="selectionColor"></l-polyline>
        <!-- Timeline pointer -->
        <l-circle-marker v-if="timelineHover" :lat-lng="timelinePoint2ArrayValue(timelineHover, getSelectedPath(activity.path))" :radius="5" :color="pointerColor"/>
        <div class="routeToolbar" @click.stop>
          <button v-if="!newRoute" @click="newRoute = []">New Route</button>
          <button v-else @click="newRoute = null">Cancel</button>
          <template v-if="newRoute">
            <input type="checkbox" v-model="manualRouting"/><label>Manual mode</label>
            <button v-if="newRoute.length > 1" @click="undoRouteStep">Undo</button>
            <button v-if="newRoute.length > 1" @click="exportRoute">Export GPX</button>
          </template>
          <button @click="recommendSegments" :disabled="activity == null">Recommend Segments</button> 
        </div>
      </l-map>

      <div class="routeList gravels toggled">
        <div class="head">
          <h1>Segments</h1>
        </div>
        <div class="scrollContainer">
          <div class="route" v-for="gr in gravels" :key="gr.id" @click="selectGravel(gr.id)" :class="{active: gravel && gravel.id === gr.id}">
            {{ gr.name }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="activity" class="activity">
      <div class="activityDetails">
        <div v-if="activity.start_date" class="detail">
          <span>{{ moment(activity.start_date).format('YYYY-MM-DD HH:mm') }}</span>
          <span>{{ moment().startOf('day').seconds(timelineHover && activity.time ? timelinePoint2ArrayValue(timelineHover, getSelectedPath(activity.time)) : activity.elapsed_time).format('H:mm:ss') }}</span>
        </div>
        <div class="name">{{ activity.name }}</div>
        <div class="detail">
          <span>{{ (activity.distance / 1000).toFixed(2) }} km</span>
          <span v-if="timelineHover && activity.distanceStream">{{ (timelinePoint2ArrayValue(timelineHover, getSelectedPath(activity.distanceStream)) / 1000).toFixed(2) }} km</span>
        </div>
        <div v-if="activity.total_elevation_gain" class="detail">
          <span>{{ activity.total_elevation_gain }} m</span>
          <span v-if="timelineHover && activity.altitude">{{ timelinePoint2ArrayValue(timelineHover, activity.altitude) }} m</span>
        </div>
      </div>

      <div class="timeline" ref="timelineContainer" :class="{loading: activity.loading}">
        <div v-if="pathSelectionStartEndIndex" class="step start back disable-select" @click="timelineStep(0, -1)">&#10094;</div>
        <div v-if="pathSelectionStartEndIndex" class="step start forward disable-select" @click="timelineStep(0, 1)">&#10095;</div>
        <canvas ref="timeline" height="0"/>
        <canvas ref="selection" @mousemove="timelineMove" @mousedown="timelineDown" @mouseup="timelineUp" @mouseout="timelineOut" height="0"/>
        <div v-if="pathSelectionStartEndIndex" class="step end back disable-select" @click="timelineStep(1, -1)">&#10094;</div>
        <div v-if="pathSelectionStartEndIndex" class="step end forward disable-select" @click="timelineStep(1, 1)">&#10095;</div>
      </div>

      <div class="newSegment">
        <template v-if="newGravel">
          <input v-model="newGravel.name" placeholder="Name"/>
          <input v-model="newGravel.description" placeholder="Description"/>
          <button @click="saveGravel()" :disabled="!newGravel.name || newGravel.name === ''">Save</button>
        </template>
        <button v-else @click="newGravel = { path: getSelectedPath(activity.path) }">
          Save as segment
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import polyline from '@mapbox/polyline'
import gpxParser from 'gpxparser'
import moment from 'moment'
import togpx from 'togpx'
import L from 'leaflet'

import { getAuthUrl, getToken, getAthlete, getActivities, getActivityStream } from '@/services/strava.service'
import { createSegment, getSegments, getSegmentsByProximity} from '@/services/api.service'
import { addRoutesToActivity } from '@/services/geo.service'
import { getDirections } from '@/services/ors.service'

export default {
  name: 'User',
  data () {
    return {
      user: null,
      stravaAuthenticated: false,
      // Map
      mapCenter: {lat: 0, lng: 0},
      mapZoom: 10,
      currentPosition: null,
      activityColor: '#FF0000',
      selectionColor: '#0000FF',
      segmentColor: '#2f2f2f',
      routeStartColor: 'green',
      routeColor: 'orange',
      routeFinishColor: 'red',
      pointerColor: 'orange',
      currentLocationColor: '#00FF00',
      seachAreaColor: '#2f2f2f',
      // Activities
      loadingActivities: false,
      activitiesPerPage: 30,
      activities: [],
      activity: null,
      // Segments
      segmentSearchRange: 2000000,
      gravels: [],
      gravel: null,
      newGravel: null,
      // Routing
      newRoute: null, // Array of paths and points
      manualRouting: false,
      segmentRoutingId: null,
      segmentRoutingPointIndex: null,
      //Timeline
      timelineHover: null,
      timelineStart: null,
      pathSelectionStartEndIndex: null
    }
  },
  mounted () {
    navigator.geolocation.getCurrentPosition((p) => {
      this.currentPosition = {lat: p.coords.latitude, lng: p.coords.longitude}
      this.mapCenter = this.currentPosition
      this.getInitialData()
    }, this.getInitialData)

    if (localStorage.token) this.getStravaData()
    else if (this.$route.query.code) getToken(this.$route.query.code).then(() => { this.$router.push('/'); this.$router.go() })
  },
  updated () {
    if (this.$refs.timeline && this.$refs.timeline.height === 0) this.sizeTimeline()
  },
  created() {
    window.addEventListener("resize", this.sizeTimeline);
  },
  destroyed() {
    window.removeEventListener("resize", this.sizeTimeline);
  },
  methods: {
    moment,
    getAuthUrl,
    getInitialData () {
      this.getSegments()
    },
    getStravaData () {
      this.stravaAuthenticated = true
      getAthlete().then(r => { if (r) { this.user = r.data; this.getActivities() } })
    },
    // Activities
    importActivity (e) {
      const context = this
      var reader = new FileReader()
      reader.readAsText(e.target.files[0])
      reader.onloadend = function(){
        var gpx = new gpxParser()
        gpx.parse(reader.result)
        const path = []
        const altitude = []
        const time = []
        gpx.tracks[0].distance.cumulative
        gpx.tracks[0].points.forEach(p => {
          path.push({lat: p.lat, lng: p.lon})
          altitude.push(p.ele)
          time.push(moment(p.time).diff(moment(gpx.metadata.time), 'seconds'))
        })
        const activity = {
          id: 'uploaded',
          name: gpx.tracks[0].name || 'Uploaded activity',
          start_date: gpx.metadata.time,
          distance: gpx.tracks[0].distance.total,
          distanceStream: gpx.tracks[0].distance.cumul,
          path,
          altitude,
          total_elevation_gain: gpx.tracks[0].elevation.pos ? gpx.tracks[0].elevation.pos.toFixed(1) : 0,
          elev_low: gpx.tracks[0].elevation.min && isFinite(gpx.tracks[0].elevation.min) ? gpx.tracks[0].elevation.min : 0,
          elev_high: gpx.tracks[0].elevation.max && isFinite(gpx.tracks[0].elevation.max) ? gpx.tracks[0].elevation.max : 0,
          time,
          elapsed_time: time[time.length - 1]
        }
        if (context.activities[0].id !== 'uploaded') context.activities.unshift(activity)
        else context.activities[0] = activity
        context.selectActivity(activity, true)
      }
    },
    getActivities () {
      if (!this.loadingActivities) {
        this.loadingActivities = true
        const page = Math.floor(this.activities.length / this.activitiesPerPage) + 1
        getActivities(this.activitiesPerPage, page).then(r => {
          this.activities = this.activities.concat(r.data)
          this.loadingActivities = false
        })
      }
    },
    selectActivity (act, forceSelect) {
      if (forceSelect || !this.activity || this.activity.id !== act.id) {
        this.activity = act
        this.activity.simplePath = this.activity.map ? polyline.decode(this.activity.map.summary_polyline).map(p => { return {lat: p[0], lng: p[1]} }) : this.activity.path
        this.resetTimeline()
        if (act.id !== 'uploaded') {
          this.activity.loading = true
          getActivityStream(act.id).then(streams => {
            if (this.activity) {
              const activity = {...this.activity}
              activity.path = streams.data.latlng.data.map(p => { return {lat: p[0], lng: p[1]} })
              activity.altitude = streams.data.altitude.data
              activity.distanceStream = streams.data.distance.data
              activity.time = streams.data.time.data
              activity.loading = false
              this.activity = activity
              this.drawTimeline()
            }
          })
        }
        this.centerAndZoomPath(this.activity.simplePath)
      } else {
        this.activity = null
      }
    },
    scrollActivities (e) {
      if (e.target.clientHeight + e.target.scrollTop === e.target.scrollHeight) {
        this.getActivities()
        setTimeout(() => { e.target.scrollTop += 100 }, 10)
      }
    },
    // Segments
    getSegments () {
      if (this.currentPosition) {
        getSegmentsByProximity(this.segmentSearchRange, null, this.currentPosition.lat, this.currentPosition.lng).then(r => {
          this.gravels = r.data.map(g => {
            g.path = polyline.decode(g.route).map(p => { return {lat: p[0], lng: p[1]} })
            return g
          })
        })
      } else {
        getSegments().then(r => {
          this.gravels = r.data.map(g => {
            g.path = polyline.decode(g.route).map(p => { return {lat: p[0], lng: p[1]} })
            return g
          })
        })
      }
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
      this.newGravel = null
    },
    recommendSegments() {
      // get current strava route
      var path = this.activity.simplePath
      var encoded = polyline.encode(path.map(x => {
          return [x.lat, x.lng]
      }))
      var range = 3000; // 5km
      // post polystring to the server
      getSegmentsByProximity(range, encoded).then(r => {
        // highlight reccomended gravel for now
        // in the future, make a route out of the activity and the segment
        if (r.data.length > 0) {
            var routes = r.data.map(s => {return polyline.decode(s.route)})
            routes = routes.map(route => {return route.map(coords => {return {lat: coords[0], lng: coords[1]}})})
            addRoutesToActivity(this.activity.simplePath, routes).then(retval => {
              this.newRoute = [retval[0], retval, retval[retval.length - 1]]
            })
          //this.selectGravel(r.data[0].id)
        }
      })
    },
    // Routing
    clickMap (e) {
      if (this.newRoute) this.addPointToRoute(e.latlng)
      if (this.segmentRoutingId) this.segmentRoutingId = null
    },
    addGravelToRoute (id, e) {
      L.DomEvent.stopPropagation(e)
      const gravel = this.gravels.find(g => g.id === id)
      let joinAtIndex = null
      let minDistance = null
      gravel.path.forEach((p, i) => {
        const distance = this.distance(p.lat, p.lng, e.latlng.lat, e.latlng.lng)
        if (i === 0 || distance < minDistance) {
          joinAtIndex = i
          minDistance = distance
        }
      })
      if (this.segmentRoutingId && this.segmentRoutingId === id) {
        if (joinAtIndex !== this.segmentRoutingPointIndex) {
          const cropped = this.getCroppedPath(gravel.path, Math.min(this.segmentRoutingPointIndex, joinAtIndex), Math.max(this.segmentRoutingPointIndex, joinAtIndex))
          this.newRoute.push(this.segmentRoutingPointIndex < joinAtIndex ? cropped : cropped.reverse())
          this.newRoute.push(gravel.path[joinAtIndex])
          this.segmentRoutingPointIndex = joinAtIndex
        }
      } else {
        this.segmentRoutingId = id
        this.segmentRoutingPointIndex = joinAtIndex
        this.addPointToRoute(gravel.path[joinAtIndex], true)
      }
    },
    addPointToRoute (latlng, keepOriginalPoint) {
      if (this.newRoute.length === 0) this.newRoute.push(latlng)
      else {
        const lastPoint = this.newRoute[this.newRoute.length - 1]
        this.newRoute.push(latlng)
        if (!this.manualRouting) {
          getDirections(lastPoint.lng + ',' + lastPoint.lat, latlng.lng + ',' + latlng.lat).then(r => {
            this.newRoute = this.newRoute.concat()
            const direction = r.data.features[0].geometry.coordinates.map(p => { return {lat: p[1], lng: p[0]} })
            this.newRoute.push(keepOriginalPoint ? this.newRoute[this.newRoute.length - 1] : direction[direction.length - 1])
            this.newRoute[this.newRoute.length - 2] = direction
            this.newRoute[this.newRoute.length - 3] = direction[0]
          })
        }
      }
    },
    undoRouteStep () {
      const route = [...this.newRoute]
      route.length = route.length - 1
      if (!route[route.length - 1].lat) route.length = route.length - 1
      this.newRoute = route
    },
    routeArrayToPath (route) {
      let path = []
      route.forEach(p => {
        if (p.lat) p = [p]
        if (path.length > 0 && p[0] === path.length[path.length - 1]) p.splice(0, 1)
        path = path.concat(p)
      })
      return path
    },
    exportRoute () {
      const blob = togpx(polyline.toGeoJSON(polyline.encode(this.routeArrayToPath(this.newRoute).map(p => [p.lat, p.lng]))), { creator: 'Gravelly App' })
      const title = 'Gravel route'
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', title + '.gpx')
      document.body.appendChild(link)
      link.click()
    },
    // Map utilities
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
    distance (lat1, lon1, lat2, lon2) {
      if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
      }
      else {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
          dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344
        return dist;
      }
    },
    // Timeline fns
    sizeTimeline () {
      if (this.$refs.timeline) {
        const parent = this.$refs.timeline.parentElement
        this.$refs.timeline.width = parent.clientWidth;
        this.$refs.timeline.height = parent.clientHeight;
        this.$refs.selection.width = parent.clientWidth;
        this.$refs.selection.height = parent.clientHeight;
        this.resetTimeline()
      }
    },
    drawTimeline () {
      if (this.$refs.timeline) {
        const canvas = this.$refs.timeline.getBoundingClientRect()
        var ctx = this.$refs.timeline.getContext("2d")
        ctx.strokeStyle = "#fda400";
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (this.activity.altitude) {
          const altitude = this.getSelectedPath(this.activity.altitude)
          let elev_high = this.activity.elev_high
          let elev_low = this.activity.elev_low
          if (this.pathSelectionStartEndIndex) {
            elev_high = Math.max(...altitude)
            elev_low = Math.min(...altitude)
          }
          ctx.beginPath()
          const elevation_diff = elev_high - elev_low
          let lastX = null
          altitude.forEach((p, i) => {
            const x = Math.floor((((i * 100) / altitude.length) * canvas.width) / 100)
            if (lastX === null || lastX !== x) {
              lastX = x
              const y = elevation_diff ? (((((p - elev_low) * 100) / elevation_diff) * canvas.height * 0.8) / 100) + canvas.height * 0.1 : canvas.height / 2
              if (i === 0) ctx.moveTo(x, canvas.height - y)
              else ctx.lineTo(x, canvas.height - y)
            }
          })
          ctx.stroke()
        }
      }
    },
    drawSelection () {
      if (this.$refs.selection) {
        const canvas = this.$refs.selection.getBoundingClientRect()
        var ctx = this.$refs.selection.getContext("2d")
        ctx.strokeStyle = "#fda400";
        ctx.fillStyle = "#ffa60036";
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (this.timelineStart) {
          ctx.beginPath()
          ctx.rect(this.timelineStart, 0, this.timelineHover - this.timelineStart, canvas.height);
          ctx.fill()
        }
        if (this.timelineHover) {
          ctx.beginPath()
          ctx.moveTo(this.timelineHover, 0)
          ctx.lineTo(this.timelineHover, canvas.height)
          ctx.stroke()
        }
      }
    },
    timelineMove (e) {
      const canvas = this.$refs.timeline.getBoundingClientRect()
      this.timelineHover = e.clientX - canvas.left
    },
    timelineDown (e) {
      const canvas = this.$refs.timeline.getBoundingClientRect()
      this.timelineStart = e.clientX - canvas.left
    },
    timelineOut () {
      this.timelineHover = null
    },
    timelineUp (e) {
      const canvas = this.$refs.timeline.getBoundingClientRect()
      this.timelineHover = e.clientX - canvas.left
      if (this.timelineStart !== this.timelineHover) {
        const startIndex = this.timelinePoint2ArrayIndex(Math.min(this.timelineStart, this.timelineHover), this.getSelectedPath(this.activity.path))
        const endIndex = this.timelinePoint2ArrayIndex(Math.max(this.timelineStart, this.timelineHover), this.getSelectedPath(this.activity.path))        
        this.pathSelectionStartEndIndex = [(this.pathSelectionStartEndIndex ? this.pathSelectionStartEndIndex[0] : 0) + startIndex]
        this.pathSelectionStartEndIndex[1] = this.pathSelectionStartEndIndex[0] + (endIndex - startIndex)
        this.centerAndZoomPath(this.getSelectedPath(this.activity.path))
        this.timelineStart = null
        this.drawTimeline()
        this.drawSelection()
      } else {
        this.resetTimeline()
        this.centerAndZoomPath(this.activity.simplePath)
      }
    },
    timelineStep (i, step) {
      const startEndIndex = [...this.pathSelectionStartEndIndex]
      startEndIndex[i] += step
      this.pathSelectionStartEndIndex = startEndIndex
      this.drawTimeline()
    },
    timelinePoint2ArrayIndex (point, path) {
      const canvas = this.$refs.timeline.getBoundingClientRect()
      const pointPerc = point * 100 / canvas.width
      return Math.round(pointPerc * (path.length - 1) / 100)
    },
    timelinePoint2ArrayValue (point, path) {
      return path[this.timelinePoint2ArrayIndex(point, path)]
    },
    getCroppedPath (path, startIndex, endIndex) {
      const croppedPath = [...path]
      croppedPath.length = endIndex
      croppedPath.splice(0, startIndex)
      return croppedPath
    },
    getSelectedPath (path) {
      if (this.pathSelectionStartEndIndex) {
        const startIndex = this.pathSelectionStartEndIndex[0]
        const endIndex = this.pathSelectionStartEndIndex[1]
        return this.getCroppedPath(path, startIndex, endIndex)
      }
      return path
    },
    getSelectingPath (path) {
      if (this.timelineStart) {
        path = this.getSelectedPath(path)
        const startIndex = this.timelinePoint2ArrayIndex(Math.min(this.timelineStart, this.timelineHover), path)
        const endIndex = this.timelinePoint2ArrayIndex(Math.max(this.timelineStart, this.timelineHover), path)
        return this.getCroppedPath(path, startIndex, endIndex)
      }
      return null
    },
    resetTimeline () {
      this.timelineStart = null
      this.pathSelectionStartEndIndex = null
      this.newGravel = null
      this.$forceUpdate()
      this.drawTimeline()
      this.drawSelection()
    }
  },
  watch: {
    timelineHover () { this.drawSelection() }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Kaushan+Script&family=Roboto&display=swap');

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

.main {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  font-family: 'Roboto', sans-serif;
}

.main > .head {
  display: flex;
  padding: 10px 15px;
  align-items: center;
  justify-content: space-between;
}
.main > .head h1 {
  font-weight: 300;
  font-family: 'Kaushan Script', cursive;
  color: var(--text-color-3);
  margin: 0;
  font-size: 30px;
}

.user_data {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user_data img {
  border-radius: 50%;
  margin-left: 20px;
  height: 40px;
}

.content {
  display: flex;
  min-height: 0;
  flex: 1;
}

.routeList {
  width: 20%;
  max-width: 250px;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-color-2);
  transition: transform .5s, position 0s ease 5s;
  position: absolute;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.routeList.toggled {
  position: relative;
  transform: none;
}
/* .routeList.loading:before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #000A;
  z-index: 2;
}
.routeList.loading:after {
  width: 50px;
  height: 50px;
  font-size: 33px;
  padding-left: 11px;
  box-sizing: border-box;
  z-index: 3;
  position: absolute;
  margin: auto;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
} */
.routeList > .head {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  height: 40px;
  z-index: 1;
  background: linear-gradient(to bottom, rgba(0,0,0,1) 0%,rgba(255,255,255,0) 100%);
  padding: 5px 30px 10px 10px;
  pointer-events: none;
  justify-content: space-between;
}
.routeList > .head h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 400;
  color: var(--text-color-3);
  font-family: 'Kaushan Script', cursive;
}
.routeList > .head .importActivity {
  pointer-events: all;
  color: var(--text-color-3);
  cursor: pointer;
  font-size: 24px;
}
.routeList .scrollContainer {
  height: 100%;
  overflow-y: auto;
  padding: 45px 5px 0;
}
.routeList .scrollContainer.loading:after {
  width: 50px;
  height: 50px;
  margin: auto;
  font-size: 33px;
  padding-left: 11px;
  box-sizing: border-box;
  display: block;
}
.routeList .route {
  cursor: pointer;
  padding: 8px 10px;
  position: relative;
  border-radius: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.routeList .route .name {
  padding-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.routeList .route .name .description {
  display: block;
  font-size: 10px;
  color: var(--text-color-2);
}
.routeList .route .details {
  white-space: nowrap;
  color: var(--text-color-2);
  font-size: 11px;
}

.activities {
  left: 0;
  transform: translateX(-100%);
}
.activities .connectStrava {
  position: absolute;
  text-align: center;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 17px;
}

.gravels {
  right: 0;
  transform: translateX(100%);
}

.leaflet-container .routeToolbar {
  position: absolute;
    z-index: 1000;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%,rgba(0,0,0,1) 100%);
    right: 0;
    padding: 10px;
}
.leaflet-container .routeToolbar button {
  margin: 0 5px;
  font-size: 17px;
  border-radius: 50px;
  border: none;
  padding: 5px 15px;
  cursor: pointer;
}
.leaflet-container .routeToolbar label {
  font-size: 20px;
  color: black;
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
  margin: 2px 0;
}
.activity .activityDetails .detail {
  margin: 3px 0;
  font-size: 10px;
  color: var(--text-color-2);
  display: flex;
  justify-content: space-between;
}
.activity .newSegment {
  padding: 10px 15px;
  flex-shrink: 0;
  width: 20%;
  max-width: 250px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.activity .newSegment input, .activity .newSegment button {
  margin-top: 5px;
}

.activity .timeline {
  position: relative;
  flex: 1;
  margin: 10px 20px;
  box-sizing: border-box;
  height: 75px;
  background-color: var(--bg-color-2);
}
.activity .timeline.loading:after {
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  top: 0;
  bottom: 0;
  width: 50px;
  height: 50px;
  font-size: 30px;
  padding-left: 12px;
  box-sizing: border-box;
}
.activity .timeline canvas {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
}
.activity .timeline.loading canvas {
  opacity: 0;
  pointer-events: none;
}
.activity .timeline .step {
  position: absolute;
  cursor: pointer;
  font-size: 20px;
  z-index: 10;
}
.activity .timeline .step.start {
  left: 5px;
}
.activity .timeline .step.end {
  right: 5px;
}
.activity .timeline .step.back {
  top: 10px;
}
.activity .timeline .step.forward {
  bottom: 10px;
}
</style>
