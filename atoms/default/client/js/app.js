// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import template from "shared/templates/template.html"
import Ractive from 'ractive'
import contains from "shared/js/contains"
//import ractiveFade from 'ractive-transitions-fade'
//import ractiveTap from 'ractive-events-tap'

fetch("https://interactive.guim.co.uk/embed/aus/2021/02/vaccine-eligibility-in-australia/rules.json")
    .then(res => res.json())
    .then(json => {
        app(json)
    });

function app(data) {

	var database = data

    var db = { 

        current : database.elements[0],

        typeSetter: (type) => {

            return (type==='disposition') ? false : true ;

        }

    }

	var GTMTag = {}

    var ractive = new Ractive({
        el: '#app',
        data: db,
        template: template
    })

    ractive.on( 'answer', function ( context, answer ) {

    	if (db.current.GTMTag) {

    		GTMTag[db.current.GTMTag] = answer

    	}

    	next(+context.node.parentElement.getAttribute("data-id"), answer)

    });

    function next(currentQ, answer) {

    	var findQ = database.flows.find(item => { return item.currentQ === currentQ && item.answer === answer}).nextQ ;

    	db.current = database.elements.find(item => { return item.id === findQ}) ;

    	if (db.current.phase_name) {

    		if (contains(database.activePhases, db.current.phase_name)) {

    			next(db.current.id, 1)

    		} else {

    			next(db.current.id, 0)

    		}

    	} else {

			if (GTMTag[db.current.GTMTag]) {

				next(db.current.id, GTMTag[db.current.GTMTag])

			} else {

				ractive.set(db)

			}
    	}
    }
}
