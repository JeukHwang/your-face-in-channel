function log(str) {
    console.log(`FACEMOJI : ${str}`);
}

async function main() {
    log("START");
    const buttonSelector = "div.MessageEditor__nonMenuWrapper--NaTSX > div.sc-fEOsli.gYkJAL > button";
    document.addEventListener("keyup", function (event) {
        if (event.key === "Enter") { log("Enter pressed"); }
    });

    window.onclick = function (event) {
        const button = document.querySelector(buttonSelector);
        const target = event.target;
        if ((button.isSameNode(target) || button.contains(target))) {
            log("Button pressed");
        }
    };
}

main();