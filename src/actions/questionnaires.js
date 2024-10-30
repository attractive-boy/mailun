import {
  REQUEST_QUESTIONNAIRES,
  RECEIVE_QUESTIONNAIRES,
  ANSWER_QUESTION,
  RECEIVE_QUESTIONNAIRE_RESULT,
} from "../constants/actionType";
import api from "../api/questionnaires";

// request questionnaires
const requestQuestionnaires = () => ({
  type: REQUEST_QUESTIONNAIRES,
});

const receiveQuestionnaires = (data) => ({
  type: RECEIVE_QUESTIONNAIRES,
  payload: data,
});

export const fetchQuestionnaires = () => async (dispatch) => {
  dispatch(requestQuestionnaires());
  const data = await api.request("/wxapi/questionnaires");
  return dispatch(receiveQuestionnaires(data));
};

// answer one question
export const answer = (questionnaireId, questionId, selectedIds) => ({
  type: ANSWER_QUESTION,
  payload: {
    questionnaireId,
    questionId,
    selectedIds,
  },
});

const receiveQuestionnaireResult = (data) => ({
  type: RECEIVE_QUESTIONNAIRE_RESULT,
  payload: data,
});

// complete one questionnaire
export const complete = (questionnaireId, answers) => dispatch => {
  return api.submitAnswers(questionnaireId, answers) // Ensure your API accepts the answers object
    .then(response => {
      // Handle successful response
      dispatch({ type: 'COMPLETE_QUESTIONNAIRE_SUCCESS', payload: response });
      return response; // 返回响应数据
    })
    .catch(error => {
      // Handle error
      dispatch({ type: 'COMPLETE_QUESTIONNAIRE_FAILURE', error });
    });
};

export const request = async (url, options = {}) => {
  const response = await api.request(url, options);
  return response;
};
