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

        function captureIframesClick(iframes) {
            iframes.forEach(function(iframe) {
                iframe.contentDocument.addEventListener("click", async function(event) {
                    await searchToFillConfigs(event).then((response) => {
                        resolve(response)
                    }).catch((error) => {
                        reject(error);
                    })
                });
            });
        }
        //clicking the main doc
        chrome.tabs.query({active: true}, function(tabs) {
            var tab = tabs[0];
            tab_title = tab.title;
            chrome.tabs.executeScript(tab.id, {
            code: 'document.querySelectorAll("iframe");'
            }, captureIframesClick);
            document.addEventListener("click", async function(event) {
                await searchToFillConfigs(event)
            });
        })
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




// listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('hitting background.js')
    // check if the message is from the popup
    if (sender.id === chrome.runtime.id) {
      // handle the request
      switch (request.action) {
        case 'modifyPage':
            startApplication()
          break;
      }
    }
  });