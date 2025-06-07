// ────────── Global Variables ──────────
let logContainer = document.querySelector(".log-container");
let logContent = document.querySelector(".log-content");
let showDebug = true
let showError = true
let showValid = true
let showTimestamp = true


// ────────── Logger Helpers ──────────
function getTimestamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};
// ────────── Create Basic Elements ──────────
function createBasicElements(typeUpper = "DEBUG", time = getTimestamp()) {
    const timeSpan = document.createElement("span")
    timeSpan.style.fontWeight = "600"
    timeSpan.style.color = "#999"
    timeSpan.style.fontFamily = `"arial-mono", "SourceCodePro", "Lucida Console"`
    timeSpan.textContent = showTimestamp ? `[${time}] ` : ``
    const keywordSpan = document.createElement("span")
    keywordSpan.style.fontWeight = "bold"
    keywordSpan.style.fontFamily = `"arial-mono", "SourceCodePro", "Lucida Console"`

    switch (typeUpper) {
        case "ERROR":
            keywordSpan.style.color = "#FF0000"
            break
        case "VALID":
            keywordSpan.style.color = "#00FF00"
            break
        case "DEBUG":
        default:
            keywordSpan.style.color = "#FFD700"
            break
    }

    keywordSpan.textContent = `[${typeUpper}] `

    return { timeSpan, keywordSpan, time }
};

// ────────── Logging Functionality ──────────
export function logMessage(message, type = "DEBUG", update = false, id = null) {
    if (!logContainer) return

    const typeUpper = type.toUpperCase()

    const { timeSpan, keywordSpan, time } = createBasicElements(typeUpper)
    if (!showTimestamp) timeSpan.style.display = "none"

    const logEntryId = id ? `progress-log-${id}` : "progress-log"

    if (update && typeUpper === "DEBUG") {
        let progressElem = document.getElementById(logEntryId)

        if (!progressElem) {
            progressElem = document.createElement("p")
            progressElem.id = logEntryId
            progressElem.appendChild(timeSpan)
            progressElem.appendChild(keywordSpan)
            progressElem.appendChild(document.createTextNode(message))
            logContent.appendChild(progressElem)
        } else {
            if (progressElem.childNodes.length > 2) {
                progressElem.childNodes[2].nodeValue = message
            } else {
                progressElem.appendChild(document.createTextNode(message))
            }
        }

        progressElem.style.display =
            (typeUpper === "DEBUG" && !showDebug) ||
                (typeUpper === "ERROR" && !showError) ||
                (typeUpper === "VALID" && !showValid)
                ? "none"
                : ""

        progressElem.scrollIntoView()
    } else {
        const logEntry = document.createElement("p")
        logEntry.appendChild(timeSpan)
        logEntry.appendChild(keywordSpan)
        logEntry.appendChild(document.createTextNode(message))

        logEntry.style.display =
            (typeUpper === "DEBUG" && !showDebug) ||
                (typeUpper === "ERROR" && !showError) ||
                (typeUpper === "VALID" && !showValid)
                ? "none"
                : ""

        logContent.appendChild(logEntry)
        logEntry.scrollIntoView()

        console.log(`[${time}] [${typeUpper}] ${message}`)
    }
}

// ────────── Toggle Log Visibility ──────────
function updateButtonState(button, isShown) {
    if (!button) return
    if (!isShown) {
        button.classList.add("active")
    } else {
        button.classList.remove("active")
    }
}

export function toggleLogVisibility() {
    if (!logContainer) return

    if (logContent.style.display === "none") {
        logContent.style.display = "block"
        logContainer.style.maxHeight = "300px"
    } else {
        logContent.style.display = "none"
        logContainer.style.maxHeight = "50px"
    }
}

function filterLogs() {
    const logs = logContent.querySelectorAll("p")
    logs.forEach((log) => {
        const keywordSpan = log.querySelector("span:nth-child(2)")
        if (!keywordSpan) {
            log.style.display = ""
            return
        }

        // Extract type text without brackets and trim
        const typeText = keywordSpan.textContent.replace(/\[|\]/g, "").trim()

        let shouldShow = true
        if (typeText === "DEBUG") shouldShow = showDebug
        else if (typeText === "ERROR") shouldShow = showError
        else if (typeText === "VALID") shouldShow = showValid

        log.style.display = shouldShow ? "" : "none"

        const timeSpan = log.querySelector("span:first-child")
        if (timeSpan) timeSpan.style.display = showTimestamp ? "" : "none"
    })
}

export function hideDebug() {
    if (!logContainer) return
    showDebug = !showDebug
    filterLogs()
    updateButtonState(document.querySelector('button[onclick="hideDebug()"]'), showDebug)
}

export function hideError() {
    if (!logContainer) return
    showError = !showError
    filterLogs()
    updateButtonState(document.querySelector('button[onclick="hideError()"]'), showError)
}

export function hideValid() {
    if (!logContainer) return
    showValid = !showValid
    filterLogs()
    updateButtonState(document.querySelector('button[onclick="hideValid()"]'), showValid)
}

export function hideTimestamp() {
    if (!logContainer) return
    showTimestamp = !showTimestamp
    filterLogs()
    updateButtonState(document.querySelector('button[onclick="hideTimestamp()"]'), showTimestamp)
}