function waitForElm(selector) {
    // Reference: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function log(str) {
    console.log(`FACEMOJI : ${str}`);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    log("START");
    const buttonSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL > button";
    document.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            log("Enter pressed");
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    window.onclick = function (event) {
        const button = document.querySelector(buttonSelector);
        const target = event.target;
        if ((button.isSameNode(target) || button.contains(target))) {
            log("Button pressed");
            event.preventDefault();
            event.stopPropagation();
        }
    };

    await delay(3000);
    const buttonWrapperSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL";

    const button = await waitForElm(buttonSelector);
    const buttonWrapperP = await waitForElm(buttonWrapperSelector);

    // const fakeButton = document.createElement("div");
    const fakeButton = button.cloneNode(true);
    buttonWrapperP.appendChild(fakeButton);
    // fakeButton.outerHTML = button.outerHTML;
    // fakeButton.children[0].children[0].textContent = "가짜";

    const observer = new MutationObserver((mutations) => {
        log("OBSERVER");
        fakeButton.className = "";
        fakeButton.classList.add(...button.classList);

        // fakeButton.outerHTML = button.outerHTML;
        // observer.disconnect();
    });
    observer.observe(button, { attributeOldValue: true });
}

window.onload = async () => {
    await main();
};


window.addEventListener('DOMContentLoaded', (event) => { console.log("LOADED?"); });