const clientId = "4dbe49231b7440c1a334ef3067f81d3e";
const clientSecret = "ee15df97c5be4bca9de95d528532c644";

let token = "";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function addToFavorites(track) {
  if (!favorites.find(fav => fav.id === track.id)) {
    favorites.push(track);
    saveFavorites();
    renderFavorites();
  }
}

function renderFavorites() {
  const favDiv = document.getElementById("favorites");
  favDiv.innerHTML = "";

  favorites.forEach(track => {
    favDiv.innerHTML += `
      <div class="card">
        <img src="${track.album.images[0]?.url || ''}" />
        <p><strong>${track.name}</strong> by ${track.artists.map(a => a.name).join(", ")}</p>
        ${track.preview_url ? `<audio controls src="${track.preview_url}"></audio>` : '<p>No preview</p>'}
        <button onclick='removeFromFavorites("${track.id}")'>❌ Remove</button>
      </div>
    `;
  });
}


async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  token = data.access_token;
  renderFavorites();

}

async function searchSpotify(query, type) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=12`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  displayResults(data, type);
}

function displayResults(data, type) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  let items = [];

  switch (type) {
    case "track":
      items = data.tracks.items;
      items.forEach(track => {
        results.innerHTML += `
          <div class="card">
            <img src="${track.album.images[0]?.url || ''}" />
            <p><strong>${track.name}</strong><br>by ${track.artists.map(a => a.name).join(", ")}</p>
            ${track.preview_url ? `<audio controls src="${track.preview_url}"></audio>` : '<p>No preview available</p>'}
            <button onclick='addToFavoritesById("${track.id}")'>❤️ Save</button>
          </div>
        `;
      });
      break;

    case "album":
      items = data.albums.items;
      items.forEach(album => {
        results.innerHTML += `
          <div class="card">
            <img src="${album.images[0]?.url || ''}" alt="Album Cover" />
            <p><strong>${album.name}</strong><br>by ${album.artists.map(a => a.name).join(", ")}</p>
          </div>
        `;
      });
      break;

    case "artist":
      items = data.artists.items;
      items.forEach(artist => {
        results.innerHTML += `
          <div class="card">
            <img src="${artist.images[0]?.url || ''}" alt="Artist Image" />
            <p><strong>${artist.name}</strong><br>Followers: ${artist.followers.total.toLocaleString()}</p>
          </div>
        `;
      });
      break;
  }
}

// Init
getAccessToken();

document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value;
  const type = document.getElementById("searchType").value;

  if (query && type) {
    searchSpotify(query, type);
  }
});
function addToFavoritesById(trackId) {
  // Find the track in the displayed search results
  const track = Array.from(document.querySelectorAll("#results .card")).find(card => {
    return card.querySelector("button").getAttribute("onclick").includes(trackId);
  });

  if (track) {
    // Extract track details from the card
    const trackDetails = {
      id: trackId,
      name: track.querySelector("p strong").textContent,
      artists: [{ name: track.querySelector("p").textContent.split("by ")[1] }],
      album: { images: [{ url: track.querySelector("img").src }] },
      preview_url: track.querySelector("audio")?.src || null,
    };

    addToFavorites(trackDetails);
  }
}

function removeFromFavorites(trackId) {
  // Filter out the track with the given ID
  favorites = favorites.filter(track => track.id !== trackId);

  // Save the updated favorites to localStorage
  saveFavorites();

  // Re-render the favorites section
  renderFavorites();
}
