# Server usage

## Running:

to run the api, simply: `node api.js`
by default it will run on port 3000.

in the future it can be combined with the vue app (but for now i don't know how vue works lol)

In order to run, postgres needs to be running
an easy way to do this is to use the docker compose file in the root directory

just run:
```
docker-compose up -d
```

this will launch a postgres server with the postGIS plugin installed
the credentials are the same as the config/config.json 'development' settings.

## Endpoints

Right now there are 2 endpoints:

### `segment`

 - GET: gets a single segment by it's ID, for example: `/segment?id=1`. Right now this isn't super useful

 - POST: creates a new segment and inserts it into the DB. a JSON request with the following parameters is required: name (string), description (string), route (GeoJSON or polyline)
for example:

```
{
    "name": "arakawa gravel bit",
    "description": "very short gravel segment near lake saiko",
    "route": "{`_yEiontYzDdEbHtAxHsDtGePxCeMlDaClDXlPxUhJxG`LuIdHcZhEuL`GoJ~HgJhJcDjHyCnGGlI?"
}
```

or

```
{
    "name": "shibagawa loop",
    "description": "flat gravel loop around the lake",
    "route": {
        "type": "LineString",
        "coordinates": [
          [
            139.7114610671997,
            35.875628484693785
          ],
          [
            139.7127914428711,
            35.87583712791925
          ],
          [
            139.71532344818112,
            35.87681078903907
          ],
          [
            139.7177267074585,
            35.87677601563371
          ],
          [
            139.71871376037598,
            35.87628918635597
          ],
          [
            139.72025871276855,
            35.874620034691134
          ],
          [
            139.72034454345703,
            35.87308994810486
          ],
          [
            139.7199583053589,
            35.871594607663646
          ],
          [
            139.7177267074585,
            35.8703078967877
          ],
          [
            139.71467971801755,
            35.869264602359934
          ],
          [
            139.7136926651001,
            35.868986388192624
          ],
          [
            139.71360683441162,
            35.86714319466217
          ],
          [
            139.71407890319824,
            35.86529995826
          ],
          [
            139.71399307250974,
            35.86387402899189
          ],
          [
            139.714035987854,
            35.862343734896484
          ]
        ]
    }  
}
```

looking at these requests it is obvious that using a polyline is more efficient.

### `segments`

 - GET: returns all the segments in the DB as a list, takes no arguments

example response:
```
[
    {
        "id": 1,
        "name": "shibagawa loop",
        "description": "flat gravel loop around the lake",
        "route": "u}}yEskvsYi@iGaEyNDaN`BcElIuHpHOjHjA~F|LpE`Rt@dEpJNnJ}A|GPpHI",
        "strava_link": null,
        "user_id": null,
        "createdAt": "2021-05-16T12:40:13.382Z",
        "updatedAt": "2021-05-16T12:40:13.382Z"
    },
    {
        "id": 2,
        "name": "kyunakagawa",
        "description": "slightly busy gravel path along the river side",
        "route": "{`_yEiontYzDdEbHtAxHsDtGePxCeMlDaClDXlPxUhJxG`LuIdHcZhEuL`GoJ~HgJhJcDjHyCnGGlI?",
        "strava_link": null,
        "user_id": null,
        "createdAt": "2021-05-16T13:14:19.396Z",
        "updatedAt": "2021-05-16T13:14:19.396Z"
    },
    {
        "id": 3,
        "name": "arakawa gravel bit",
        "description": "very short gravel segment near lake saiko",
        "route": "{`_yEiontYzDdEbHtAxHsDtGePxCeMlDaClDXlPxUhJxG`LuIdHcZhEuL`GoJ~HgJhJcDjHyCnGGlI?",
        "strava_link": null,
        "user_id": null,
        "createdAt": "2021-05-16T13:25:12.848Z",
        "updatedAt": "2021-05-16T13:25:12.848Z"
    }
]
```


## DB migrations

Migrations can be created and run using sequelize
here is the documentation:
https://sequelize.org/master/manual/migrations.html

some examples
```
# make a new table
npx sequelize-cli model:generate --name Segment --attributes name:string,description:string,route:geometry,strava_link:string
# run the migration
npx sequelize-cli db:migrate
# undo a migration
npx sequelize-cli db:migrate:undo
```
