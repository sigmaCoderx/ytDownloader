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

// here you can put your base url like // "http://localhost:4000"
// const API_BASE =
//   window.location.protocol === "file:"
//     ? "http://localhost:4000"
//     : window.location.origin;


const API_BASE = "https://5.189.180.71:4000"; // backend production url

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
    const response = await fetch(`${API_BASE}/api/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  setDownloadingState(true);

  try {
    const response = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentUrl, type: selectedType }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || "Failed to download media");
    }

    const fileName = getFileNameFromResponse(response) || fallbackFileName();

    // Pull the response into memory as a Blob, then hand it to the
    // browser's own download mechanism (object URL + synthetic click).
    // The actual saving to disk is done entirely by the browser, not us.
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error(error);
    alert(`Download failed: ${error.message || "Unknown error"}`);
  } finally {
    setDownloadingState(false);
  }
}

function setDownloadingState(isDownloading) {
  downloadBtn.disabled = isDownloading;
  downloadBtn.textContent = isDownloading ? "DOWNLOADING..." : "DOWNLOAD NOW";
  downloadBtn.classList.toggle("opacity-70", isDownloading);
  downloadBtn.classList.toggle("cursor-not-allowed", isDownloading);
}

function getFileNameFromResponse(response) {
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function fallbackFileName() {
  const ext = selectedType === "audio" ? "m4a" : "mp4";
  const base = (currentTitle || "download").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
  return `${base}.${ext}`;
}
