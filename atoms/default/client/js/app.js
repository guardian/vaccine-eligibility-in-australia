// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import template from "shared/templates/template.html"
import Ractive from 'ractive'
import contains from "shared/js/contains"
import infodal from 'shared/templates/modal.html'
import Modal from 'shared/js/modal'
import ractiveFade from 'ractive-transitions-fade'
import ractiveTap from 'ractive-events-tap'
import { $, $$, round, numberWithCommas, wait, getDimensions } from 'shared/js/util'

fetch("https://interactive.guim.co.uk/embed/aus/2021/02/vaccine-eligibility-in-australia/rules.json")
    .then(res => res.json())
    .then(json => {
        app(json)
    });

function app(data) {

	var database = data

	console.log(data)

    var isIframe = (parent !== window) ? false  : true ;

    var stage = (isIframe) ? parent.document : document ; 

    if (isIframe) {
    	console.log("Inside iframe")
    } else {
    	console.log("Not inside iframe")
    }

	var elem = stage.createElement('div');

	elem.classList.add("interactive-container");

	stage.body.appendChild(elem);

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

				document.querySelectorAll('[data-key]').forEach(item => {
				  	item.addEventListener('click', event => {
				    	modus(item.getAttribute("data-key"))
					})
				})

			}
    	}
    }

    function modus(key) {

    	var info = database.stateDefinitions.default[key]

        var modal = new Modal({
            transitions: { fade: ractiveFade },
            events: { tap: ractiveTap },
            template: infodal,
            data: {
            	info : info,
                isApp: (window.location.origin === "file://" || window.location.origin === null) ? true : false 
            }
        });

        var isAndroidApp = (window.location.origin === "file://" && /(android)/i.test(navigator.userAgent) ) ? true : false ;

        var el = $('.modal-content');

        el.ontouchstart = function(e) {

            if (isAndroidApp && window.top.GuardianJSInterface.registerRelatedCardsTouch) {

				window.top.GuardianJSInterface.registerRelatedCardsTouch(true);

            }
        };

        el.ontouchend = function(e) {

            if (isAndroidApp && window.top.GuardianJSInterface.registerRelatedCardsTouch) {

				window.top.GuardianJSInterface.registerRelatedCardsTouch(false);

            }

        };
    }
}
