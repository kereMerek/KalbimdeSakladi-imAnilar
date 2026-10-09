const revealItems = document.querySelectorAll(".reveal");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");
const closeButton = lightbox.querySelector(".lightbox-close");
let previouslyFocused = null;
const musicButton = document.querySelector(".music-toggle");
const musicStatus = document.querySelector(".music-status");
const spotifyFallback = document.querySelector(".spotify-fallback");
const musicSlash = document.querySelector(".music-slash");
let spotifyController = null;
let isPlaying = false;

function resizeSpotifyFrame() {
  const frame = document.querySelector(".music-widget iframe");
  if (!frame) return;
  const width = Math.min(340, Math.max(220, window.innerWidth - 64));
  frame.style.setProperty("width", `${width}px`, "important");
  frame.width = String(width);
}

function updateMusicState(playing) {
  isPlaying = playing;
  musicButton.classList.toggle("is-playing", playing);
  musicSlash.hidden = playing;
  musicButton.setAttribute("aria-pressed", String(playing));
  musicButton.setAttribute("aria-label", playing ? "Müziği durdur" : "Müziği başlat");
  musicStatus.textContent = playing ? "Şarkı çalıyor" : "Durduruldu";
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  IFrameAPI.createController(
    document.querySelector("#spotify-player"),
    {
      uri: "spotify:track:1rNMTCu6xsmHb3LQNGfZOw",
      width: 340,
      height: 152
    },
    (controller) => {
      spotifyController = controller;
      musicButton.disabled = false;
      musicStatus.textContent = "Çalmak için nota dokun";
      resizeSpotifyFrame();
      controller.addListener("playback_update", (event) => {
        updateMusicState(!event.data.isPaused);
      });
    }
  );
};

musicButton.addEventListener("click", () => {
  if (!spotifyController) return;
  spotifyController.togglePlay();
  updateMusicState(!isPlaying);
});
window.addEventListener("resize", resizeSpotifyFrame);

const spotifyApi = document.createElement("script");
spotifyApi.src = "https://open.spotify.com/embed/iframe-api/v1";
spotifyApi.async = true;
spotifyApi.addEventListener("error", () => {
  musicButton.disabled = true;
  musicStatus.textContent = "Spotify oynatıcısı yüklenemedi.";
  spotifyFallback.hidden = false;
});
document.body.append(spotifyApi);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

function openLightbox(image, trigger) {
  if (image.naturalWidth === 0) return;
  previouslyFocused = trigger;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = image.dataset.caption || image.alt;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  closeButton.focus();
  document.body.style.overflow = "hidden";
}

document.querySelectorAll(".photo-placeholder img").forEach((image) => {
  const photo = image.closest(".photo-placeholder");
  const placeholderNote = photo.querySelector(".placeholder-note");
  const markPhotoReady = () => {
    placeholderNote.hidden = true;
    photo.classList.add("has-image");
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", "Fotoğrafı büyüt");
    photo.tabIndex = 0;
  };

  image.addEventListener("load", markPhotoReady);
  image.addEventListener("error", () => {
    image.hidden = true;
  });
  if (image.complete && image.naturalWidth > 0) {
    markPhotoReady();
  } else if (image.complete) {
    image.hidden = true;
  }

  photo.addEventListener("click", () => openLightbox(image, photo));
  photo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(image, photo);
    }
  });
});

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxImage.src = "";
  if (previouslyFocused) previouslyFocused.focus();
}

closeButton.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
});
