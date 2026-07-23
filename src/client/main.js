const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const thumbnail = document.getElementById("thumbnail");
const titleNode = document.getElementById("title");
const channelNode = document.getElementById("channel");
const videoOption = document.getElementById("videoOption");
const audioOption = document.getElementById("audioOption");
const downloadBtn = document.getElementById("downloadBtn");

let currentUrl = "";
let selectedType = null;
let currentTitle = "";
const API_BASE =
  window.location.protocol === "file:"
    ? "https://hamstring-eternity-impish.ngrok-free.dev" //BACKEND-URL
    : window.location.origin;

urlForm.addEventListener("submit", onFetchInfo);
videoOption.addEventListener("click", (e) => selectOption(e, "video"));
audioOption.addEventListener("click", (e) => selectOption(e, "audio"));
downloadBtn.addEventListener("click", startDownload);

async function onFetchInfo(e) {
  e.preventDefault();
  currentUrl = urlInput.value.trim();
  if (!currentUrl) {
    alert("Please paste a YouTube URL");
    return;
  }

  loading.classList.remove("hidden");
  result.classList.add("hidden");

  try {
  //   const response = await fetch(`${API_BASE}/api/info`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "ngrok-skip-browser-warning": "true" // to allow the ngrok
  //     },
  //     body: JSON.stringify({ url: currentUrl }),
  //   });

  const response = await fetch(`/api/info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true" // to allow the ngrok
    },
    body: JSON.stringify({ url: currentUrl }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || "Failed to fetch info");
  }

  const info = await response.json();
  currentTitle = info.title || "Untitled";
  thumbnail.src = info.thumbnail || "";
  titleNode.textContent = currentTitle;
  channelNode.textContent = info.channel || "Unknown Channel";

  selectedType = null;
  downloadBtn.classList.add("hidden");
  videoOption.classList.remove("border-red-600");
  audioOption.classList.remove("border-red-600");
  result.classList.remove("hidden");
} catch (error) {
  console.error(error);
  alert(`Could not fetch video info: ${error.message || "Unknown error"}`);
} finally {
  loading.classList.add("hidden");
}
}

function selectOption(e, type) {
  e.preventDefault();
  selectedType = type;
  videoOption.classList.toggle("border-red-600", type === "video");
  audioOption.classList.toggle("border-red-600", type === "audio");
  downloadBtn.classList.remove("hidden");
}

async function startDownload() {
  if (!currentUrl || !selectedType) return;

  downloadBtn.disabled = true;
  const previousLabel = downloadBtn.textContent;
  downloadBtn.textContent = "DOWNLOADING...";

  try {
    const a = document.createElement("a");
    const params = new URLSearchParams({
      url: currentUrl,
      type: selectedType,
    });
    a.href = `${API_BASE} / api / download ? ${params.toString()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error(error);
    alert(`Download failed: ${error.message || "Unknown error"}`);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = previousLabel;
  }
}
