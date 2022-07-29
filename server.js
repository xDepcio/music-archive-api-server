const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    if(req.method === 'GET' && req.url === '/artists') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(Object.values(artists)))
      return
    }

    if(req.method === 'GET' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const artistId = urlParts[2]
        const artist = artists[artistId]
        res.setHeader('Content-Type', 'application/json')
        if(artist === undefined) {
          res.statusCode = 404
          res.end(JSON.stringify({
            message: "Artist not found",
            statusCode: 404
          }))
          return
        }
        else {
          let artistAlbums = Object.values(albums).filter((album) => album.artistId == artistId)
          console.log(artistAlbums)
          res.statusCode = 200
          res.end(JSON.stringify(
            {
              name: artist.name,
              artistId: artist.artistId,
              albums: artistAlbums
            }
          ))
          return
        }
      }
    }

    if(req.method === 'POST' && req.url === '/artists') {
      const artistNewId = getNewArtistId()
      artists[artistNewId] = {
        artistId: artistNewId,
        name: req.body.name
      }
      res.statusCode = 201
      res.setHeader('Content-Type', 'application/json')
      req.body['artistId'] = artistNewId
      res.end(JSON.stringify(req.body))
      return
    }

    if(req.method === 'PATCH' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const artistId = urlParts[2]
        const artist = artists[artistId]
        artist.name = req.body.name
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        let today = new Date();
        let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        res.end(JSON.stringify({
          name: artist.name,
          artistId: artist.artistId,
          updatedAt: date
        }))
        return
      }
    }

    if(req.method === 'DELETE' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const artistId = urlParts[2]
        delete artists[artistId]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          "message": "Sucessfully deleted"
        }))
        return
      }
    }

    if(req.method === 'GET' && req.url.startsWith('/artists/') && req.url.endsWith('/albums')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 4) {
        const artistId = urlParts[2]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        let artistAlbums = Object.values(albums).filter((album) => album.artistId == artistId)
        res.end(JSON.stringify(artistAlbums))
        return
      }
    }

    if(req.method === 'GET' && req.url.startsWith('/albums/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const albumId = urlParts[2]
        const album = albums[albumId]
        const artist = artists[album.artistId]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        console.log('ALBUM ID', albumId)
        let albumsSongs = Object.values(songs).filter(song => song.albumId == albumId)
        let response = {
          name: album.name,
          albumId: Number(albumId),
          artistId: artist.artistId,
          artist: artist,
          songs: albumsSongs
        }
        res.end(JSON.stringify(response))
        return
      }
    }

    if(req.method === 'POST' && req.url.startsWith('/artists/') && req.url.endsWith('/albums')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 4) {
        const artistId = urlParts[2]
        let newAlbumId = getNewAlbumId()
        albums[newAlbumId] = {
          albumId: newAlbumId,
          name: req.body.name,
          artistId: artistId
        }

        res.statusCode = 201
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(albums[newAlbumId]))
        return
      }
    }

    if(req.method === 'PATCH' && req.url.startsWith('/albums/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const albumId = urlParts[2]
        const album = albums[albumId]
        album.name = req.body.name
        let today = new Date();
        let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        album.updatedAt = date
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(album))
        return
      }
    }

    if(req.method === 'DELETE' && req.url.startsWith('/albums/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const albumId = urlParts[2]
        delete albums[albumId]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          message: "Sucessfully deleted"
        }))
        return
      }
    }

    if(req.method === 'GET' && req.url.startsWith('/artists/') && req.url.endsWith('/songs')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 4) {
        const artistId = urlParts[2]
        let artistAlbumsIds = []
        Object.values(albums).forEach((album) => {
          if(album.artistId == artistId) {
            artistAlbumsIds.push(album.albumId)
          }
        })
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        let artistsSongs = Object.values(songs).filter(song => artistAlbumsIds.includes(song.albumId))
        res.end(JSON.stringify(artistsSongs))
        return
      }
    }

    if(req.method === 'GET' && req.url.startsWith('/albums/') && req.url.endsWith('/songs')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 4) {
        const albumId = urlParts[2]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        let albumSongs = Object.values(songs).filter(song => song.albumId == albumId)
        res.end(JSON.stringify(albumSongs))
        return
      }
    }

    if(req.method === 'GET' && req.url.startsWith('/songs/')) {
      const urlParts = req.url.split('/')
      console.log('TTTTTTTTTTTTT')
      if(urlParts.length === 3) {
        const songId = urlParts[2]
        const song = songs[songId]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        let songInfo = {
          name: song.name,
          lyrics: song.lyrics,
          trackNumber: song.trackNumber,
          songId: song.songId,
          albumId: song.albumId,
          album: albums[song.albumId],
          artist: artists[albums[song.albumId].artistId]
        }
        res.end(JSON.stringify(songInfo))
        return
      }
    }

    if(req.method === 'POST' && req.url.startsWith('/albums/') && req.url.endsWith('/songs')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 4) {
        const albumId = urlParts[2]
        let newSongId = getNewSongId()
        songs[newSongId] = {
          songId: newSongId,
          name: req.body.name,
          trackNumber: req.body.trackNumber,
          albumId: albumId,
          lyrics: req.body.lyrics
        }
        res.statusCode = 201
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(songs[newSongId]))
        return
      }
    }

    if(req.method === 'PATCH' && req.url.startsWith('/songs/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const songId = urlParts[2]
        if(req.body.name !== undefined) songs[songId].name = req.body.name
        if(req.body.lyrics !== undefined) songs[songId].lyrics = req.body.lyrics
        if(req.body.trackNumber !== undefined) songs[songId].trackNumber = req.body.trackNumber
        let today = new Date();
        let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        songs[songId].updatedAt = date
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(songs[songId]))
        return
      }
    }

    if(req.method === 'DELETE' && req.url.startsWith('/songs/')) {
      const urlParts = req.url.split('/')
      if(urlParts.length === 3) {
        const songId = urlParts[2]
        delete songs[songId]
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(  {
          message: "Sucessfully deleted"
        }))
        return
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log('Server is listening on port', port));
