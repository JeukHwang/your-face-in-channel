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

function log(str, debug = false) {
    if (debug) {
        console.log(`FACEMOJI : ${str}`);
    }
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

async function getTextMsgs() {
    const textMsgTagSelector = "div.Text__textWrapper--pHJ9j > p.Text__text--vTgs0";
    const textMsgTags = await waitFor(textMsgTagSelector, true);
    return Array.from(textMsgTags);
};

async function getEmojiUrl(emojiName) {
    const defaultUrl = "https://channel-emoji.s3.ap-northeast-2.amazonaws.com/channel.png";
    // const defaultUrl = "https://thumbs.dreamstime.com/b/funny-face-baby-27701492.jpg";
    const purifiedName = emojiName.slice(1, -1);
    const baseUrl = "https://e198-115-94-114-198.jp.ngrok.io";
    const url = `${baseUrl}/emoji/${purifiedName}`;
    const res = await fetch(new Request(url), {
        method: "get",
        headers: new Headers({ "ngrok-skip-browser-warning": "69420", }),
    });
    if (res.status === 200) {
        try {
            const emojiUrl = await (res.json());
            if (emojiUrl !== null) {
                return emojiUrl.inside;
            }
        } catch (e) {
            if (!(e instanceof SyntaxError)) { throw e; }
        }
    }
    return defaultUrl;
}

async function renderExpr() {
    log(`Start renderExpr`);
    const content = await getTextMsgs();
    content.forEach(async element => {
        const msg = element.innerHTML;
        const exprs = msg.match(/;[A-Za-z-_]+;/g);
        if (exprs !== null) {
            const exprToUrl = await Promise.all(exprs.map(expr => getEmojiUrl(expr)));
            const exprToTag = exprToUrl.map((expr) => `<img class="channel-emoji" src=${expr}>`);
            log(`${exprs.join(" | ")} found in ${msg}`);
            let innerHTML = msg;
            for (let i = 0; i < exprs.length; i++) {
                innerHTML = innerHTML.replace(exprs[i], exprToTag[i]);
            }
            element.innerHTML = innerHTML;
        }
    });
    log(`Finish renderExpr`);
}

async function observeMsg() {
    const msgStreamSelector = "div.ContentAreastyled__ContentAreaWrapper-ch-desk__sc-14c83id-0";
    const msgStream = await waitFor(msgStreamSelector);
    log("observeMsg init");
    await delay(2000);
    await blockSend();
    await renderExpr();
    const observer = new MutationObserver(async function anonymous(mutations, observer) {
        log("observeMsg");
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