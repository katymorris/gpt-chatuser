var configs = {
    "initialMessage": "",
    "inputElement": ""
}

searchToFillConfigs = (event) => {
    return new Promise((resolve, reject) => {
        let target = event.target;
  
        target.style.backgroundColor = "yellow";
  
        setTimeout(() => {
            if (confirm("Confirm if this the correct item?")) {
                for (const key in configs) {
                    if (configs[key] === "") {
                        if (key === "inputElement") {
                            configs[key] = target;
                        } else if (key === "initialMessage") {
                            configs[key] = target.innerText;
                        }
                        
                        resolve(true)
                    }
                }
                console.log('target.innerText' + target.innerText)
                configs.initialMessage = target.innerText;
                resolve(target.innerText);
            } else {
                reject("nothing selected")
            }
        }, 1000);
      });
}

async function initiateFindInitialMessage() {
    return new Promise((resolve, reject) => {
        //clicking the main doc
        document.addEventListener("click", async function(event) {
            await searchToFillConfigs(event)
        });

        //clicking the iframes
        let iframes = document.querySelectorAll("iframe");
        iframes.forEach(function(iframe) {
            iframe.contentDocument.addEventListener("click", async function(event) {
                await searchToFillConfigs(event).then((response) => {
                    resolve(response)
                }).catch((error) => {
                    reject(error);
                })
            });
        });
    });
}


async function callInitialMessage() {
    var data = "intention=buy%20a%20phone";
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            configs.inputElement.value = this.responseText;
        } 
    });

    xhr.open("POST", "http://localhost:3000/getInitialMessage");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.send(data);
}

async function startApplication(configs) {
    await initiateFindInitialMessage().then((response) => {    
        callInitialMessage()
    });
}

