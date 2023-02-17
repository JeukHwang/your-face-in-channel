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

async function getLastMsg() {
    const lastMsgTagSelector = "div.Messagestyled__Wrapper-ch-desk__sc-19x3rf3-0";
    const msgs = Array.from((await waitFor(lastMsgTagSelector, true)));
    const lastMsg = msgs[msgs.length - 1];
    const name = lastMsg.querySelector("div.Text__textWrapper--pHJ9j").textContent;
    const src = lastMsg.querySelector("div.Image__imgWrapper--Qrfjk > img").src ?? null;
    return [name, src];
}

const baseUrl = "https://e198-115-94-114-198.jp.ngrok.io";

async function blockSend() {
    const buttonSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL > button";
    const button = await waitFor(buttonSelector);

    const manageRoomUrl = "https://desk.channel.io/#/channels/121635/team_chats/groups/250728";

    async function tryToSend() {
        log("TRY TO SEND", true);
        const buttonSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL > button";
        const button_ = await waitFor(buttonSelector);
        button_.click();
        await delay(1000);
        if (window.location.href === manageRoomUrl) {
            log("Enter Manage Room", true);
            const [name, src] = await getLastMsg();
            const isTriggered = name.match(/^\[[A-Za-z-_]+\]$/) !== null;
            if (isTriggered && src !== null) {
                const purifiedName = name.slice(1, -1);
                const data = new FormData();
                const file = await fetch(new Request(src));
                const blob = await file.blob();
                data.append("file", blob);
                data.append("emoji-name", purifiedName);
                const res = await fetch(new Request(`${baseUrl}/emoji/`, {
                    method: "post",
                    headers: new Headers({ "ngrok-skip-browser-warning": "69420", }),
                    body: data
                }));
                console.log(res.status, res);
            }
        }
    }

    document.addEventListener("keydown", async function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            log("Enter pressed", true);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            await tryToSend();
        }
    }, true);

    const buttonWrapperSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL";
    const buttonWrapperP = await waitFor(buttonWrapperSelector);
    const fakeButton = button.cloneNode(true);
    fakeButton.children[0].children[0].innerText = "가짜";
    fakeButton.onclick = async () => {
        log("FakeButton pressed", true);
        await tryToSend();
    };
    buttonWrapperP.appendChild(fakeButton);
    button.style.display = "none";
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

async function renderExpr(content) {
    log(`Start renderExpr`);
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

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

async function observeMsg() {
    const msgStreamSelector = "div.ContentAreastyled__ContentAreaWrapper-ch-desk__sc-14c83id-0";
    const msgStream = await waitFor(msgStreamSelector);
    log("observeMsg init", true);
    await delay(2000);
    await blockSend();
    const content = await getTextMsgs();
    await renderExpr(content);
    const updateFunc = debounce(async (mutations, observer) => {
        log("observeMsg", true);
        observer.disconnect();
        // console.log("MUT", Array.from(mutations[0].addedNodes));
        await blockSend();
        // const content = Array.from(mutations[0].addedNodes);
        const content = await getTextMsgs();
        await renderExpr(content);
        observer.observe(msgStream, { childList: true, subtree: true });
    });
    const observer = new MutationObserver(async function anonymous(mutations, observer) {
        await updateFunc(mutations, observer);
    });
    observer.observe(msgStream, { childList: true, subtree: true });
}

window.onload = async () => {
    log("START");
    await observeMsg();
    log("END");
};