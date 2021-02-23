// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
fetch("https://interactive.guim.co.uk/embed/aus/2021/02/vaccine-eligibility-in-australia/rules.json")
    .then(res => res.json())
    .then(json => {
        console.log(json)
    });