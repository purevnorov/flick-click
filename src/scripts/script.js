let lightStateOn = true;
let motionDetectOn = true;

const ledOffUrl = "http://esp8266.local/?led=off";
const motionOnUrl = "http://esp8266.local/?motion=on";
const motionOffUrl = "http://esp8266.local/?motion=off";
const url = "http://esp8266.local/?feedback";

//CHANGE BRIGHTNESS
//HANDLING BRIGHTNESS INPUT
function brightnessRestrict(e) {
  let charCode = (e.which) ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 49 || charCode > 51)) {
    return false;
  } {
    return true;
  }
}

let brightness = 3;
let ledOnUrl = "http://esp8266.local/?led=3";

$("#brightness").on("input",() => {
  if ($("#brightness").val() == ""){
    return false;
  }
  else{
    brightness = parseInt($("#brightness").val());
  }
  ledOnUrl = `http://esp8266.local/?led=${brightness}`;
  if(lightStateOn) {
    fetch(ledOnUrl)
  }
});

const switchStyleBig = [
  {
    "justify-content": "flex-start",
    "background-color": "#cddcdc",
    "background-image":
      "radial-gradient(at 50% 100%,rgba(255, 255, 255, 0.5) 0%,rgba(0, 0, 0, 0.5) 100%),linear-gradient(to bottom,rgba(255, 255, 255, 0.25) 0%,rgba(0, 0, 0, 0.25) 100%)",
    "background-blend-mode": "screen, overlay",
  },
  {
    "justify-content": "flex-end",
    "background-color": "#98fb98",
    "background-image": "",
    "background-blend-mode": "",
  },
];

const switchStyleSmall = [
  {
    "justify-content": "flex-start",
    "background-color": "#cddcdc",
    "background-image":
      "radial-gradient(at 50% 100%,rgba(255, 255, 255, 0.5) 0%,rgba(0, 0, 0, 0.5) 100%),linear-gradient(to bottom,rgba(255, 255, 255, 0.25) 0%,rgba(0, 0, 0, 0.25) 100%)",
    "background-blend-mode": "screen, overlay",
  },
  {
    "justify-content": "flex-end",
    "background-color": "#98fb98",
    "background-image": "",
    "background-blend-mode": "",
  },
];

function changeSwitchStyle(classname) {
  let currentClass = undefined;

  if (classname === ".inner-shape-big") {
    currentClass = classname;
    if (lightStateOn) {
      $(currentClass).css(switchStyleBig[0]);
      lightStateOn = false;
    } else {
      $(currentClass).css(switchStyleBig[1]);
      lightStateOn = true;
    }
  }

  if (classname === ".inner-shape-small") {
    currentClass = classname;
    if (motionDetectOn) {
      $(currentClass).css(switchStyleSmall[0]);
      motionDetectOn = false;
    } else {
      $(currentClass).css(switchStyleSmall[1]);
      motionDetectOn = true;
    }
  }
}

function httpGetJson(url) {
  fetch(url)
    .then(function (response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then(function (responseAsJson) {
      updateCondition(responseAsJson);
    })
    .catch((error) => {
      isConnected = false;
      $(".wifi-status").html("DISCONNECTED");
      $(".indicator").css({
        "background-color": "#ff0000",
        "box-shadow": "",
      })
      $(".md-label-content").html("DISCONNECTED")
      $("#brightness").attr("placeholder", `1-3`);
      $(".state-content").text(`!`);
      $(".temprature-content").html("°");
      $(".humidity-content").html("%");
      console.error("Error:", error);
    });
}

function lightToggle() {
  changeSwitchStyle(".inner-shape-big");
  if (lightStateOn) {
    $(".state-content").text(`${brightness}`);
    fetch(ledOnUrl);
  } else {
    $(".state-content").text(`0`);
    fetch(ledOffUrl);
  }
}

function motionDetectToggle() {
  changeSwitchStyle(".inner-shape-small");
  if(motionDetectOn) {
    $(".indicator").css({
      "background-color": "#fca903",
      "box-shadow": "",
    })
    $("md-label-content").html("WAITING MOTION");
    fetch(motionOnUrl);
  }
  else{
    $(".indicator").css({
      "background-color": "#ff0000",
      "box-shadow": "",
    })
    $("md-label-content").html("DETECTOR OFF");
    fetch(motionOffUrl);
  }

}

function updateCondition(jsonfile) {
  //WIFI CONNECTION STATUS UPDATE
  isConnected = jsonfile.connectionstatus;
  if (isConnected) {
    $(".wifi-status").html("CONNECTED");
  }

  //TEMPRATURE AND HUMIDITY UPDATE
  let temp = "" + jsonfile.temprature + "°";
  let humidity = "" + jsonfile.humidity + "%";
  $(".temprature-content").html(temp);
  $(".humidity-content").html(humidity);

  //LIGHT STATE ON OFF SYNC
  let isOn = undefined;
  if (jsonfile.ledstate != 0) {
    isOn = true;
    $("#brightness").attr("placeholder", `${jsonfile.ledstate}`);
    $(".state-content").text(`${jsonfile.ledstate}`);
  }
  else {
    $("#brightness").attr("placeholder", `0`);
    $(".state-content").text(`0`);
    isOn = false;
  }

  if(isOn != lightStateOn){
    changeSwitchStyle(".inner-shape-big");
  }

  //MOTION DETECTOR ON OFF SYNC
  if(jsonfile.motionstate != motionDetectOn){
    changeSwitchStyle(".inner-shape-small");
  }

  //MOTION DETECTOR LOGIC
  if(jsonfile.motionstate){
    if (jsonfile.motiondetected) {
      $(".indicator").css({
        "background-color": "#98fb98",
        "box-shadow": "0px 0px 5px 2px #ffffff",
      })
      $(".md-label-content").html("MOTION DETECTED");
    }
    else {
      $(".indicator").css({
        "background-color": "#fca903",
        "box-shadow": "",
      })
      $(".md-label-content").html("WAITING MOTION"); 
    }
  }
  else {
    $(".indicator").css({
      "background-color": "#ff0000",
      "box-shadow": "",
    })
    $(".md-label-content").html("DETECTOR OFF");
  }
}

$(document).ready(function () {
  fetch(ledOnUrl);
  fetch(motionOnUrl);
});

let ssid;
let password;
let isConnected = false;

function openPanel() {
  $(".flex-container-1").css({
    "filter": "brightness(60%)",
  })

  $(".cloud").css({
    "filter": "blur(15px)",
  })

  $(".device-field-wrapper").css({
    "display": "flex",
  })
}

function closePanel() {
  $(".flex-container-1").css({
    "filter": "",
  })

  $(".cloud").css({
    "filter": "",
  })
  $(".device-field-wrapper").css({
    "display": "none",
  })
}

function submitWifi() {
  ssid = $("#ssid").val();
  password = $("#password").val();
  $(".wifi-status").html("CONNECTING...")
  let createdUrl = `http://192.168.11.4/?ssid=${ssid}&pass=${password}`;
  fetch(createdUrl);

  let customUrl = `http://esp8266.local/?ssid=${ssid}&pass=${password}`;
  fetch(customUrl);
}

let passIsShown = false;
function togglePass(isShown){
  let input = document.getElementById("password");
  if(isShown){
    passIsShown = false;
    input.type = "password";
    $(".thebox").css({
      "background-color": "",
      "border": "",
      "-webkit-transform": "",
      "-ms-transform": "",
      "transform": "",
    })
  }
  else{
    $(".thebox").css({
      "background-color": "#98fb98",
      "border": "3px solid #ffffff",
      "-webkit-transform": "rotate(315deg)",
      "-ms-transform": "rotate(315deg)",
      "transform": "rotate(315deg)",
    })
    passIsShown = true;
    input.type = "text";
  }
}

setInterval(function () {
  httpGetJson(url);
}, 2500);