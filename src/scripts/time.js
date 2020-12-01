let timerOff = true;

let hourInput = 0;
let minInput = 0;
let secInput = 0;
let netSec = 0;
let netSecFull = 0;
let offset = 480;
let offsetFull = 512;
let toOn = true;
let time = {
  hr: 0,
  min: 0,
  sec: 0,
};

let conditionOn = undefined;

let numEntered = 0;
function inputRestrict(e) {
  let charCode = (e.which) ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    return false;
  } {
    return true;
  }

}

$("#hour").on("change", () => {
  if ($("#hour").val() >= 24) {
    hourInput = 23;
    $("#hour").val("23");
  } else {
    hourInput = parseInt($("#hour").val());
  }
});

$("#minute").on("change", () => {
  if ($("#minute").val() >= 60) {
    minInput = 59;
    $("#minute").val("59");
  } else {
    minInput = parseInt($("#minute").val());
  }
});

$("#second").on("change", () => {
  if ($("#second").val() >= 60) {
    secInput = 59;
    $("#second").val("59");
  } else {
    if (($("#second").val() <= 1) && ($("#minute").val() == "") && ($("#hour").val() == "")){
      $("#second").val("2")
      secInput = 2;
    }
    else {
      secInput = parseInt($("#second").val());
    }
  }
});

function timerButton(state) {
  if (state === 1) {
    conditionOn = true;
    $("#off-button").css({
      border: "7px solid #ffffff",
      "background-color": "#999999",
      padding: "15px 30px",
      color: "#ffffff",
      cursor: "pointer",
    });
    $("#on-button").css({
      border: "7px solid #ffffff",
      "background-color": "#98fb98",
      padding: "25px 35px",
      color: "#000000",
      cursor: "default",
      transition: "0.5s",
    });
  }

  if (state === 0) {
    conditionOn = false;
    $("#on-button").css({
      border: "7px solid #ffffff",
      "background-color": "#999999",
      padding: "15px 35px",
      color: "#ffffff",
      cursor: "pointer",
    });
    $("#off-button").css({
      border: "7px solid #ffffff",
      "background-color": "#98fb98",
      padding: "25px 30px",
      color: "#000000",
      cursor: "default",
      transition: "0.5s",
    });
  }
}

function changeOffSet(offset) {
  $(".middle-circle").css({
    "stroke-dashoffset": `${offset}`,
  });
}

function changeOffSetFull(offsetFull) {
  $(".middle-circle-2").css({
    "stroke-dashoffset": `${offsetFull}`
  })
}

function timeLog(seconds) {
  if (seconds > 60) {
    if (seconds / 60 > 60) {
      time.hr = Math.floor(seconds / 60 / 60);
      seconds = seconds - time.hr * 3600;
      time.min = Math.floor(seconds / 60);
      seconds = seconds - time.min * 60;
      time.sec = Math.floor(seconds);
    } else {
      time.hr = 0;
      time.min = Math.floor(seconds / 60);
      seconds = seconds - time.min * 60;
      time.sec = Math.floor(seconds);
    }
  } else {
    time.hr = 0;
    time.min = 0;
    time.sec = seconds;
  }

  if (time.hr < 10) {
    $("#hour-svg").text("0" + time.hr);
  } else {
    $("#hour-svg").text(time.hr);
  }

  if (time.min < 10) {
    $("#minute-svg").text("0" + time.min);
  } else {
    $("#minute-svg").text(time.min);
  }

  if (time.sec < 10) {
    $("#second-svg").text("0" + time.sec);
  } else {
    $("#second-svg").text(time.sec);
  }
}

function timer() {
  if (netSec > 0) {
    offset = offset - 480 / 60;
    offsetFull = offsetFull - 512/netSecFull;
    netSec = netSec - 1;
    timeLog(netSec);
    changeOffSet(offset);
    changeOffSetFull(offsetFull);
  }
}

let intervals = [];

function clearAllIntervals() {
  for (i = 0; i < intervals.length; i++) {
    clearInterval(intervals[i]);
  }
}

function toggleTimer() {
  if (isNaN(hourInput) || hourInput === undefined) {
    hourInput = 0;
  }
  if (isNaN(minInput) || minInput === undefined) {
    minInput = 0;
  }
  if (isNaN(secInput) || secInput === undefined) {
    secInput = 0;
  }

  if (timerOff && (conditionOn != undefined) && (hourInput + minInput + secInput > 0)) {
    $("#on-button").attr("onclick", "");
    $("#off-button").attr("onclick", "");
    if (conditionOn) {
      $("#off-button").css({ "cursor": "default" })
    }
    else {
      $("#on-button").css({ "cursor": "default" })
    }
    timerOff = false;
    offset = 480;
    offsetFull = 512;
    netSec = hourInput * 60 * 60 + minInput * 60 + secInput;
    netSecFull = netSec;
    $("input").prop("disabled", true);
    $(".timer-button-content").text("STOP");

    intervals[intervals.length] = setInterval(() => {
      timer(netSec);
      if (netSec == 1) {
        setTimeout(() => {
          if (conditionOn) {
            $("#brightness").attr("placeholder", `${brightness}`);
            $(".state-content").text(`${brightness}`);
            $(".inner-shape-big").css(switchStyleBig[1])
            fetch(ledOnUrl);
          }
          else {
            $("#brightness").attr("placeholder", `0`);
            $(".state-content").text(`0`);
            $(".inner-shape-big").css(switchStyleBig[0])
            fetch(ledOffUrl);
          }
          // alert("TIME'S UP!");
          timerOff = true;
          netSec = 0;
          netSecFull = 0;
          $("input").prop("disabled", false);
          $(".timer-button-content").text("START");
          $("#hour-svg").text(`00`);
          $("#minute-svg").text(`00`);
          $("#second-svg").text(`00`); $("#on-button").attr("onclick", "timerButton(1)");
          $("#off-button").attr("onclick", "timerButton(0)");
          $("#off-button").css({
            "background-color": "#999999",
            "padding": "15px 30px",
            "color": "#ffffff",
            "cursor": "pointer",
          })
          $("#on-button").css({
            "background-color": "#999999",
            "padding": "15px 35px",
            "color": "#ffffff",
            "cursor": "pointer",
          });
          conditionOn = undefined;
          changeOffSet(480);
          changeOffSetFull(512);
          timerOff = true;
          clearAllIntervals();
        }, 2000);
      }
    }, 1000);
  } else {
    clearAllIntervals();
    netSec = 0;
    netSecFull = 0;
    timerOff = true;
    $("input").prop("disabled", false);
    $(".timer-button-content").text("START");
    $("#hour-svg").text(`00`);
    $("#minute-svg").text(`00`);
    $("#second-svg").text(`00`);
    $("#on-button").attr("onclick", "timerButton(1)");
    $("#off-button").attr("onclick", "timerButton(0)");
    $("#off-button").css({
      "background-color": "#999999",
      "padding": "15px 30px",
      "color": "#ffffff",
      "cursor": "pointer",
    })
    $("#on-button").css({
      "background-color": "#999999",
      "padding": "15px 35px",
      "color": "#ffffff",
      "cursor": "pointer",
    });
    conditionOn = undefined;
    changeOffSet(480);
    changeOffSetFull(512);
  }
}

window.onload = function () {
  const hourId = document.getElementById('hour');
  hourId.onpaste = function (e) {
    e.preventDefault();
  }
  const minuteId = document.getElementById('minute');
  minuteId.onpaste = function (e) {
    e.preventDefault();
  }
  const secondId = document.getElementById('second');
  secondId.onpaste = function (e) {
    e.preventDefault();
  }
}