function waitFor(selector, all = false) {
    // Reference: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
    const selectFunc = () => (!all) ? document.querySelector(selector) : document.querySelectorAll(selector);
    return new Promise(resolve => {
        if (selectFunc()) {
            return resolve(selectFunc());
        }
        const observer = new MutationObserver(mutations => {
            if (selectFunc()) {
                resolve(selectFunc());
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

async function blockSend() {
    const buttonSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL > button";
    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            log("Enter pressed");
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }, true);

    const buttonWrapperSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL";
    const button = await waitFor(buttonSelector);
    const buttonWrapperP = await waitFor(buttonWrapperSelector);
    const fakeButton = button.cloneNode(true);
    fakeButton.children[0].children[0].innerText = "가짜";
    buttonWrapperP.appendChild(fakeButton);
    button.style.display = "none";
    fakeButton.onclick = () => {
        log("FakeButton pressed");
    };
    log("FakeButton activated");

    const observer = new MutationObserver((mutations) => {
        fakeButton.className = "";
        fakeButton.classList.add(...button.classList);
    });
    observer.observe(button, { attributeOldValue: true });
}

async function getContent() {
    const textMsgTagSelector = "div.Text__textWrapper--pHJ9j > p.Text__text--vTgs0";
    const textMsgTags = await waitFor(textMsgTagSelector, true);
    return Array.from(textMsgTags);
};

function hasExpr(str) {
    return str.match(/;[A-Za-z-]+;/g);
}

const emojiMap = (str) => "🔥"; // pseudo!!!

async function renderExpr() {
    log(`Render Update Start`);
    const content = await getContent();
    content.forEach(element => {
        const msg = element.textContent;
        if (hasExpr(msg) !== null) {
            console.log(`Expr found in ${msg} ${hasExpr(msg)}`);
            const textContent = hasExpr(msg).reduce(
                (textContent_, expr) => textContent_.replace(expr, emojiMap(expr)), element.textContent
            );
            element.textContent = textContent;
        }
    });
    log(`Render Update Finish`);
}

async function observeMsg() {
    const msgStreamSelector = "div.ContentAreastyled__ContentAreaWrapper-ch-desk__sc-14c83id-0";
    const msgStream = await waitFor(msgStreamSelector);
    log("MsgStream observe - init");
    await delay(2000);
    await blockSend();
    await renderExpr();
    const observer = new MutationObserver(async function anonymous(mutations, observer) {
        log("MsgStream observe");
        observer.disconnect();
        await blockSend();
        await renderExpr();
        observer.observe(msgStream, { childList: true, subtree: true });
    });
    observer.observe(msgStream, { childList: true, subtree: true });
}

window.onload = async () => {
    log("START");
    await observeMsg();
    log("END");
};