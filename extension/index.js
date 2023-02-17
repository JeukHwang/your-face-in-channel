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
    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            log("Enter pressed");
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }, true);

    await delay(2000);
    const buttonWrapperSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL";
    const button = await waitForElm(buttonSelector);
    const buttonWrapperP = await waitForElm(buttonWrapperSelector);
    const fakeButton = button.cloneNode(true);
    fakeButton.children[0].children[0].innerText = "가짜";
    buttonWrapperP.appendChild(fakeButton);
    button.style.display = "none";

    const observer = new MutationObserver((mutations) => {
        log("OBSERVER");
        fakeButton.className = "";
        fakeButton.classList.add(...button.classList);
    });
    observer.observe(button, { attributeOldValue: true });
}

window.onload = async () => {
    await main();
};