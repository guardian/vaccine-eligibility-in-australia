import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import HomePage from '../components/HomePage/HomePage';
import Age from '../components/Age/Age';
import BasicDetail from '../components/BasicDetails/BasicDetails';
import QuestionCard from '../components/Questionarries/QuestionCard';
import Navigation from '../components/Navigation/Navigation';
import Review from '../components/Review/Review';
import * as utils from '../utils/utils';
import * as services from '../services/services';

// import mockRules from '../models/mock-rules.json';
const errorMessage = `The vaccines eligibility checker isn’t currently available. Please try again later.`;


const Main = () => {

  // States
  const [userAge, setUserAge] = useState(null);
  const [userState, setUserState] = useState(null);
  const [questionsAsked, updateQuestionsAsked] = useState([]);
  const [currentQuestionIndex, setcurrentQuestionIndex] = useState(null);
  const [questionsModel, setQuestionsModel] = useState([]);
  const [dataError, setDataError] = useState(null);
  const [stateBasedDef, setStateBasedDef]  = useState(null);
  const [defaultStateDef, setDefaultStateDef]  = useState(null);

  //States from model object
  const [model, setModel] = useState(null);
  const [flows,setFlows] = useState([]);
  const [activePhases, setActivePhases] = useState([]);
  const [currentPage, setCurrentPage] = useState('homePage');

  //Normal variable declarations
  let currentPhaseName = null;
 
  // event handlers
  const initEligibilityChecker = () => {
    updateQuestionsAsked([]);
    setUserAge(null);
    setUserState(null);
    setCurrentPage('agePage');
  };

  const handleAnsSelection = (newQuestionarry) => {
    const askedQuestions = [...questionsAsked];
    let duplicateQIndex = null;
    const duplicateQ = askedQuestions.find((item, index) => {
      if (item.question.id === newQuestionarry.question.id) {
        duplicateQIndex = index;
        return true;
      }
      else return false;
    });

    if (duplicateQ) {
      if (duplicateQ.answer.value === newQuestionarry.answer.value) {
        return;
      }
      else {
        (duplicateQIndex === askedQuestions.length - 1) ? askedQuestions.splice(duplicateQIndex, 1, newQuestionarry) : askedQuestions.splice(duplicateQIndex, askedQuestions.length, newQuestionarry);
        updateQuestionsAsked(askedQuestions);
        setcurrentQuestionIndex(duplicateQIndex);
      }
    }
    else {
      askedQuestions.push(newQuestionarry);
      updateQuestionsAsked(askedQuestions);
      if (currentQuestionIndex === null) setcurrentQuestionIndex(0);
    }
  }

  const handleNavigation = (nextQuestionIndex) => {
    // got to state page
    if (nextQuestionIndex === -1 && (currentQuestionIndex === null || currentQuestionIndex === 0) && currentPage === 'questionsPage') {
      setcurrentQuestionIndex(0);
      setCurrentPage('statePage');
    }
    if (currentPage === 'statePage' && nextQuestionIndex === 1) currentPage('questionPage');
    setcurrentQuestionIndex(currentQuestionIndex + nextQuestionIndex);
  }

  const handleAge = (age) => {
    setCurrentPage('statePage');
    if (age !== userAge) {
      updateQuestionsAsked([]);
      setUserState(null);
    }
    setUserAge(age);
  }

  const backHome = () => {
    setCurrentPage('homePage');
  }

  const handleStateChange = (selectedState) => {
    setStateBasedDef(model.stateDefinitions[selectedState]);
    setDefaultStateDef(model.stateDefinitions.default);
    if (selectedState !== userState) updateQuestionsAsked([]);
    setUserState(selectedState);
    setcurrentQuestionIndex(0);
  }

  const handleStateNext = () => {
    setCurrentPage('questionsPage');
    setcurrentQuestionIndex(0);
  }

  const backAge = () => {
    setCurrentPage('agePage');
  }
  

  // Business logics
  const ageDecision = (ques) => {
    const match = ques.options.find(opt => {
      const [min, max] = opt.text.split('-');
      if (!max) return userAge >= parseInt(min.replace('+', ''));
      else return utils.isValidRange(userAge, parseInt(min), parseInt(max));
    });
    if (match) {
      let nextQuesId = flows.find(flow => flow.currentQ === ques.id && flow.answer === match.value).nextQ;
      const nextQuestObj = questionsModel.find(ques => ques.id === nextQuesId)
      if (nextQuestObj.phase_name && activePhases.length) {
        currentPhaseName = nextQuestObj.phase_name;
        nextQuesId = activePhases.includes(ques.phase_name) ? 5010 : 5020;
        return { question: questionsModel.find(ques => ques.id === nextQuesId), answer: null };
      }
      else {
        currentPhaseName = null;
        return { question: nextQuestObj, answer: null }
      }
    }
    else {
      currentPhaseName = null;
      return { question: ques, answer: null };
    }
  }

  const getNextQuestion = () => {
    const currQ = questionsAsked[currentQuestionIndex - 1].question.id;
    const currA = questionsAsked[currentQuestionIndex - 1].answer.value;
    const match = flows.find(flow => flow.currentQ === currQ && flow.answer === currA)
    if (match) {
      const ques = questionsModel.find(ques => ques.id === match.nextQ);
      if (ques.phase_name && activePhases.length) {
        currentPhaseName = ques.phase_name;
        const nextQuesObj = flows.find(flow => {
          return (flow.currentQ === ques.id && flow.answer === (activePhases.includes(ques.phase_name) ? 1 : 0));
        });
        return { question: questionsModel.find(ques => ques.id === nextQuesObj.nextQ), answer: null};
      }
      else if (ques.type === 'user-details') {
        currentPhaseName = null;
        return ageDecision(ques);
      }
      else {
        currentPhaseName = null;
        return { question: ques, answer: null };
      }
    }
    else return { question: questionsModel[0], answer: null };
  }

  const getCurrentQuestion = () => {
    if (currentQuestionIndex !== null && questionsAsked && questionsAsked.length && currentQuestionIndex < questionsAsked.length) {
      return questionsAsked[currentQuestionIndex]; // show the selected question from questions asked
    }

    else if (!currentQuestionIndex && !questionsAsked.length) {
      return ageDecision(questionsModel[0]);
    }

    else if (questionsModel && currentQuestionIndex < questionsModel.length) {
      return getNextQuestion();
    }

  }

  const createGUID = () => {
    var dt = new Date().getTime();
    var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return `${guid}-${Date.now()}`;
}


  // form Submit
  const doRegister = (isEligible) => {

    const userInput = {
      "uid": createGUID(),
      "eligibleOnPhase": currentPhaseName ? currentPhaseName.replace('phase_', '') : '',
      "versionOfEligibilityCriteria": model.version,
      "userResponses": [
        { "question": "What is your age?", "answer": userAge },
        { "question": "What is your State?", "answer": userState }
      ]
    };
    questionsAsked.map(item => userInput.userResponses.push( { "question": item.question.title, "answer": item.answer.text }));
    
    if(isEligible) services.makeBooking(userInput, result => window.open(result, "_self"));
    else services.submitUserInputs(userInput, url => {window.open(url, "_self")});
  }

  // component renderers
  const renderQuestionary = () => {
    const isBookingEnabled = model.enableBooking;
    if (currentPage === 'questionsPage' && questionsModel) {
      const disableNext = !(currentQuestionIndex != null && questionsAsked && questionsAsked.length && currentQuestionIndex < questionsAsked.length && Object.keys(questionsAsked[currentQuestionIndex].answer).length > 0);
      const nextQuestion = getCurrentQuestion();
      const dispositionClass = nextQuestion.question.type === 'disposition' ? 'app_disposition' : '';
      return (
        <div className={`app_question ${dispositionClass}`}>
          <QuestionCard state={nextQuestion} onSelect={handleAnsSelection} displayMode='question' isDisposition={nextQuestion.question.type === 'disposition'} onSubmit={doRegister} isEligible={model.activePhases.includes(currentPhaseName)} isBookingEnabled={isBookingEnabled}  stateBasedDef={stateBasedDef} defaultStateDef={defaultStateDef} />
          {nextQuestion.question.type === 'disposition' ? <Review questionsAsked={questionsAsked} userAge={userAge} userState={userState} /> : ''}
          <Navigation onSelect={handleNavigation} disablePrev={false} disableNext={disableNext} qid={nextQuestion.question.GTMTag} />
        </div>
      )
    }
    else return '';
  }

  // rendering State page
  const renderState = () => {
    const stateAttrs = {
      title: "Which state or territory are you in?",
      image_filename: "covid-vaccine_state.png",
      image_description: "People of various States"
    }
    return (
      <div className="app_question">
        <BasicDetail attrs={stateAttrs} selectedState={userState} onPrev={backAge} onChange={handleStateChange} onNext={handleStateNext}></BasicDetail>
      </div>
    )
  }
  // get remote json
  const fetchConfigData = () => {
    const rulesUrl = `https://${window.location.hostname}/rules.json`;
    fetch(rulesUrl, { headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    }},)
    .then(function(response) {
      if (response.status >= 400) {
        setDataError(errorMessage);
      }
      return response.json();
    })
    .then(function(data) {
      setModel(data);
      setQuestionsModel([...data.elements]);
      setFlows([...data.flows]);
      setActivePhases([...data.activePhases]);
      setDataError(null);
    })
    .catch(() => {
      setDataError(errorMessage);
    });
  }

  useEffect(() => {
    if (!model) {
      fetchConfigData()
    }
  }, [model])

  let ageAttrs = model ? model.elements.find(elem => elem.id==100) : null;
  
  // Main renderer
  return (
    <div className="vac-eli">
      <Header />
      <main className="app">
        <div className="app_container cont">
          <div className="app_container-row">
            {currentPage === 'homePage' ? <HomePage onChange={initEligibilityChecker} enableStart={!!model} error={dataError} /> : ''}
            {currentPage === 'agePage' ? <div className="app_question"><Age age={userAge} attrs={ageAttrs} onNext={handleAge} onPrev={backHome} /> </div>: ''}
            {currentPage === 'statePage' ? renderState() : '' }
            {currentPage === 'questionsPage' ? renderQuestionary() : ''}
            {currentPage !== 'homePage' ? <Review questionsAsked={questionsAsked} userAge={userAge} userState={userState}/> : ''}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Main;