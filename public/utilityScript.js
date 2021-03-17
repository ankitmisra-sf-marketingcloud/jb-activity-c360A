//import fetch from "node-fetch";

var staticUrl = "https://amc-creative-content.mgnt-xspdev.in/intelligent-segments";
$(".radio-group .radio").click(function () {
    $(this)
        .parent()
        .parent()
        .find(".radio")
        .removeClass("selected");
    $(this).addClass("selected");
    var val = $(this).attr("data-value");
    stepOneUrl = staticUrl + "/" + val + "/hux_intelligent_segment-";
    console.log(stepOneUrl);
});

$(document).on("change", "#datetimepicker", function () {
    var date = new Date($("#datetimepicker").val());
    day = date.getDate();
    month = date.getMonth() + 1;
    year = date.getFullYear();
    stepTwoUrl = stepOneUrl + [month, day, year].join("_") + ".json";
    console.log(stepTwoUrl);

    fetch('https://jb-split-activity.herokuapp.com/activity/saveurl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: stepTwoUrl
        })
    })
    .then((res) => res.json())
    .then((uPath) => console.log(uPath))
    .then((data) => console.log(data))
    .catch((err) => console.log(err))
});