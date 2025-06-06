// ────────── Global Variables ──────────
let logContainer = document.querySelector(".log-container");
let logContent = document.querySelector(".log-content");

// ────────── Logger Helpers ──────────
function getTimestamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

function createBasicElements(typeUpper = "DEBUG") {
    const timeSpan = document.createElement("span");
    timeSpan.style.fontWeight = "600";
    timeSpan.style.color = "#999";
    timeSpan.style.fontFamily = `"arial-mono", "SourceCodePro", "Lucida Console"`;
    timeSpan.textContent = `[${time}] `;
    const keywordSpan = document.createElement("span");
    keywordSpan.style.fontWeight = "bold";
    keywordSpan.style.fontFamily = `"arial-mono", "SourceCodePro", "Lucida Console"`;

    switch (typeUpper) {
        case "ERROR":
            keywordSpan.style.color = "#FF0000";
            break;
        case "VALID":
            keywordSpan.style.color = "#00FF00";
            break;
        case "DEBUG":
        default:
            keywordSpan.style.color = "#FFD700";
            break;
    }

    keywordSpan.textContent = `[${typeUpper}]`;

    return {timeSpan, keywordSpan};
}

const padding = 20;

// ────────── Logging Functionality ──────────
export function logMessage(message, type = "DEBUG", update = false) {

    if (!logContainer) return //Guard statement

    const time = getTimestamp();
    const typeUpper = type.toUpperCase();

    if (update && typeUpper === "DEBUG") {
        let progressElem = document.getElementById("progress-log");
        const {timeSpan, keywordSpan} = createBasicElements(typeUpper);
        if (!progressElem) {
            progressElem = document.createElement("p");
            progressElem.id = "progress-log";
            progressElem.appendChild(timeSpan);
            progressElem.appendChild(keywordSpan);
            progressElem.appendChild(document.createTextNode(message));
            logContent.appendChild(progressElem);
            progressElem.scrollIntoView();
        } else {
            if (progressElem.childNodes.length > 2) {
                progressElem.childNodes[2].nodeValue = message;
            } else {
                progressElem.appendChild(document.createTextNode(message));
            }
        }
        progressElem.scrollIntoView();
    } else {
        const logEntry = document.createElement("p");
        const { timeSpan, keywordSpan } = createBasicElements();

        logEntry.appendChild(timeSpan);
        logEntry.appendChild(keywordSpan);
        logEntry.appendChild(document.createTextNode(message));
        logContent.appendChild(logEntry);
        logEntry.scrollIntoView();

        console.log(`[${time}] [${typeUpper}] ${message}`);
    }
}

// ────────── Toggle Log Visibility ──────────
export function toggleLogVisibility() {

    if (!logContainer) return //Guard statement

    if (logContent.style.display === "none") {
        logContent.style.display = "block";
        logContainer.style.maxHeight = "300px";
    } else {
        logContent.style.display = "none";
        logContainer.style.maxHeight = "50px";
    }
}
